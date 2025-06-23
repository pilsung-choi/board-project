import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Role, User } from 'src/user/entity/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(User)
    private readonly UserRepository: Repository<User>,
    @InjectRepository(Chat)
    private readonly ChatRepository: Repository<Chat>,
    @InjectRepository(ChatRoom)
    private readonly ChatRoomRepository: Repository<ChatRoom>,
  ) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.ChatRoomRepository.createQueryBuilder(
      'chatRoom',
    )
      .innerJoin('chatRoom.user', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();

    chatRooms.forEach((room) => {
      client.join(room.id.toString());
    });
  }

  async createMessage(
    payload: { sub: number },
    { message, room }: CreateChatDto,
    qr: QueryRunner,
  ) {
    const user = await this.UserRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    const chatRoom = await this.getOrCreateChatRoom(user, qr, room);

    const msgModel = await qr.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    });

    const client = this.connectedClients.get(user.id);

    client
      .to(chatRoom.id.toString())
      .emit('newMessage', plainToClass(Chat, msgModel));

    return message;
  }

  async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room값을 필수로 제공해야합니다.');
      }

      return qr.manager.findOne(ChatRoom, {
        where: { id: room },
        relations: ['users'],
      });
    }

    let chatRoom = await qr.manager
      .createQueryBuilder(ChatRoom, 'chatRoom')
      .innerJoin('chatRoom.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await qr.manager.findOne(User, {
        where: { role: Role.admin },
      });

      chatRoom = await this.ChatRoomRepository.save({
        users: [user, adminUser],
      })

        [(user.id, adminUser.id)].forEach((userId) => {
          const client = this.connectedClients.get(userId);

          if (client) {
            client.emit('roomCreated', chatRoom.id);
            client.join(chatRoom.id.toString());
          }
        });
    }

    return chatRoom;
  }
}

import { Controller, Post, Headers, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Authrization } from './decorator/authrization.decorator';

@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiBasicAuth()
  // authorization: basic $token
  registerUser(@Authrization() token: string) {
    // // Extract the token from the Authorization header
    // const token = authHeader.split(' ')[1];

    // Call the AuthService to register the user
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  @ApiBasicAuth()
  loginUser(@Authrization() token: string) {
    console.log(token);
    // Call the AuthService to login the user
    return this.authService.login(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return { accessToken: await this.authService.issueToken(req.user, false) };
  }
}

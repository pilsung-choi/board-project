import { Controller, Post, Headers, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // authorization: basic $token
  registerUser(@Headers('Authorization') token: string) {
    // // Extract the token from the Authorization header
    // const token = authHeader.split(' ')[1];

    // Call the AuthService to register the user
    return this.authService.register(token);
  }

  @Post('login')
  loginUser(@Headers('Authorization') token: string) {
    // Call the AuthService to login the user
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return { accessToken: await this.authService.issueToken(req.user, false) };
  }
}

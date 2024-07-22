import { bcryptAdapter, envs, JwtAdapter } from '../../config';
import { UserModel } from '../../data';
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain';
import { EmailService } from './email.service';

export class AuthService {
  //DI
  constructor(private readonly emailService: EmailService) {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await UserModel.findOne({ email: registerUserDto.email });
    if (existUser) throw CustomError.badRequest('Email already exists');

    try {
      const user = new UserModel(registerUserDto);

      //Encrypt the password
      user.password = bcryptAdapter.hash(registerUserDto.password);

      await user.save();

      //JWT <---to keep the user authentication
      const token = await JwtAdapter.generateToken({
        id: user.id,
      });
      if (!token) {
        throw CustomError.internalServer('Error while creating token');
      }

      //Confirmation email
      await this.sendEmailValidationLink(user.email);

      const { password, ...userEntity } = UserEntity.fromObject(user);

      return { user: userEntity, token: token };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  public async loginUser(loginUserDto: LoginUserDto) {
    const user = await UserModel.findOne({ email: loginUserDto.email });
    if (!user) throw CustomError.badRequest('Email does not exist');

    try {
      if (!bcryptAdapter.compare(loginUserDto.password, user!.password)) {
        throw CustomError.internalServer('Invalid credentials');
      }

      const { password, ...userEntity } = UserEntity.fromObject(user);

      const token = await JwtAdapter.generateToken({
        id: user.id,
      });
      if (!token) {
        throw CustomError.internalServer('Error while creating token');
      }

      return { user: userEntity, token: token };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  private sendEmailValidationLink = async (email: string) => {
    const token = await JwtAdapter.generateToken({ email });
    if (!token) throw CustomError.internalServer('Error getting token');

    const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`;
    const html = `
      <h1>Validate your email</h1>
      <p>Cilck on link to validate your email</p>
      <a href="${link}">Validate your email ${email}</a>
    `;

    const options = {
      to: email,
      subject: 'Validate your email',
      htmlBody: html,
    };

    const isSend = await this.emailService.sendEmail(options);

    if (!isSend) throw CustomError.internalServer('Error sending email');

    return true;
  };

  public validateEmail = async (token: string) => {
    const payload = await JwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized('Invalid token');

    //console.log({ payload });
    const { email } = payload as { email: string };
    if (!email) throw CustomError.internalServer('Email not in token');

    const user = await UserModel.findOne({ email });
    if (!user) throw CustomError.internalServer('Email does not exist');

    user.emailValidated = true;
    await user.save();

    return true;
  };
}

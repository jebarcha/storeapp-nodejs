import { bcryptAdapter, JwtAdapter } from '../../config';
import { UserModel } from '../../data';
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain';

export class AuthService {
  //DI
  constructor() {}

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
}

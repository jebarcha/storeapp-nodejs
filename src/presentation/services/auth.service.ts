import { bcryptAdapter } from '../../config';
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

      //Confirmation email
      //console.log('UserEntity.fromObject');
      //console.log(user);
      const { password, ...userEntity } = UserEntity.fromObject(user);
      //console.log(user);
      //console.log('entity here');
      //console.log(userEntity);

      return { user: userEntity, token: 'ABC' };
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

      const { password, ...userEntity } = UserEntity.fromObject(loginUserDto);

      return { user: userEntity, token: 'ABC' };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }
}

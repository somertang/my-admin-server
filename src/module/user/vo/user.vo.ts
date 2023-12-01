import { UserEntity } from '../entity/user.entity';
import {OmitVO} from '@/utils/vo.utils';

// eslint-disable-next-line prettier/prettier
export class UserVO extends OmitVO(UserEntity, ['userPassword']) {
  avatarPath?: string;
}

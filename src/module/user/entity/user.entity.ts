import {Column, Entity} from 'typeorm';
// import * as dayjs from 'dayjs';
import { omit } from 'lodash';
import {BaseEntity} from "@/common/base.entity";
import {UserVO} from "@/module/user/vo/user.vo";

// const dateTransformer = {
//   from: (value: Date | number) => {
//     return dayjs(typeof value === 'number' ? value: value.getTime()).format('YYYY-MM-DD HH:mm:ss');
//   },
//   to: () => new Date(),
// };

@Entity('my_user')
export class UserEntity extends BaseEntity{
  @Column({
    name: 'user_name',
    comment: '用户名',
  })
  userName: string;
  @Column({
    name: 'nick_name',
    comment: '用户昵称',
  })
  nickName: string;
  @Column({
    name: 'sex',
    comment: '性别（0:女，1:男）',
    nullable: true,
  })
  sex?: number;
  @Column({
    name: 'user_password',
    comment: '密码',
  })
  userPassword: string;
  @Column({
    name: 'user_mobile',
    comment: '手机号码',
  })
  userMobile: string;
  @Column({
    name: 'user_email',
    comment: '邮箱地址',
  })
  userEmail: string;
  @Column({
    name: 'user_wechart',
    comment: '微信号',
    nullable: true
  })
  userWechart?: string;
  @Column({
    name: 'user_avatar',
    comment: '用户头像',
    nullable: true
  })
  userAvatar?: string;
  @Column({
    name: 'user_desc',
    comment: '个人描述',
    nullable: true
  })
  userDesc?: string;
  @Column({
    default: 0,
    name: 'user_lock',
    comment: '锁定:1/0'
  })
  userLock?: number;
  @Column({
    default: 1,
    name: 'user_enable',
    comment: '启用:1/0'
  })
  userEnable?: number;
  toVO(): UserVO {
    const userVO = omit<UserEntity>(this, ['password', 'avatar']) as UserVO;
    // userVO.avatarPath = this.avatarEntity?.filePath;
    return userVO;
  }
}

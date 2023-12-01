import { Provide } from '@midwayjs/core';
import { UserEntity } from '../entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
// import { omit } from 'lodash';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { BaseService } from '@/common/base.service';
import { R } from '@/common/base.error';
import { omit } from 'lodash';
import { UserVO } from '@/module/user/vo/user.vo';
// import {UserDto} from "@/module/user/dto/user.dto";

@Provide()
export class UserService extends BaseService<UserEntity> {
  @InjectEntityModel(UserEntity)
  userModal: Repository<UserEntity>;

  getModel(): Repository<UserEntity> {
    return this.userModal;
  }

  /**
   * 创建用户
   * @param entity
   */
  async createUser(entity: UserEntity) {
    const { userName, userEmail, userMobile } = entity;
    let isExist = (await this.userModal.countBy({ userName })) > 0;
    if (isExist) {
      throw R.error('当前用户名已存在');
    }
    isExist = (await this.userModal.countBy({ userMobile })) > 0;
    if (isExist) {
      throw R.error('当前手机号码已存在');
    }
    isExist = (await this.userModal.countBy({ userEmail })) > 0;
    if (isExist) {
      throw R.error('当前邮箱地址已存在');
    }
    // 添加用户的默认密码是123456，对密码进行加盐加密
    const password = bcrypt.hashSync('123456', 10);
    entity.userPassword = password;

    await this.userModal.save(entity);

    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  async editUser(entity: UserEntity): Promise<UserVO> {
    const { userName, userEmail, userMobile, id } = entity;
    let user = await this.userModal.findOneBy({ userName });
    if (user && user.id !== id) {
      throw R.error('当前用户名已存在');
    }
    user = await this.userModal.findOneBy({ userMobile });
    if (user && user.id !== id) {
      throw R.error('当前手机号码已存在');
    }
    user = await this.userModal.findOneBy({ userEmail });
    if (user && user.id !== id) {
      throw R.error('当前邮箱地址已存在');
    }

    await this.userModal.save(entity);
    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  // /**
  //  * 创建用户
  //  * @param user
  //  */
  // async createUser(user: UserEntity){
  //   const result = await this.userModal.save(user);
  //   return result;
  // }
  //
  // /**
  //  * 修改用户
  //  * @param user
  //  */
  // async updateUser(user: UserEntity){
  //   const result = await this.userModal.save(user);
  //   return result;
  // }
  //
  // /**
  //  * 删除用户
  //  * @param user
  //  */
  // async deleteUser(user: UserEntity){
  //   const result = await this.userModal.remove(user);
  //   return result;
  // }
  //
  // /**
  //  * 分页查询用户
  //  * @param page
  //  * @param pageSize
  //  * @param where
  //  */
  // async pageUser(page: number, pageSize: number, where?: FindOptionsWhere<UserEntity>){
  //   const order: any = { createdDate: 'desc' };
  //   const [data, total] = await this.userModal.findAndCount({
  //     order,
  //     skip: page * pageSize,
  //     take: pageSize,
  //     where,
  //   });
  //   return { data, total };
  // }
  //
  // /**
  //  * 根据查询条件返回全部用户
  //  * @param where
  //  */
  // async listUser(where?: FindOptionsWhere<UserEntity>){
  //   const order: any = { createdDate: 'desc' };
  //   const result = await this.userModal.find({
  //     order,
  //     where,
  //   });
  //   return result;
  // }
}

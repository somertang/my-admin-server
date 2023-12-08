import { MenuEntity } from '../entity/menu.entity';
import { PickVO } from '@/utils/vo.utils';

// eslint-disable-next-line prettier/prettier
export class MenuVO extends PickVO(MenuEntity, []) {}

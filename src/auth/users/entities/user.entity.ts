import {
  ObjectType,
  Field,
  registerEnumType,
  HideField,
} from '@nestjs/graphql';

export enum UserRoles {
  ADMIN = 'ADMIN',
  BUYER = 'BUYER',
  SUBADMIN = 'SUBADMIN',
}

registerEnumType(UserRoles, {
  name: 'UserRoles',
});

@ObjectType()
export class User {
  id: string;

  email: string;

  firstName?: string;

  lastName?: string;
  @HideField()
  password?: string;

  /**
   * Check if a user's email is verified
   */

  verified?: boolean;

  @Field(() => UserRoles)
  role?: string;
}

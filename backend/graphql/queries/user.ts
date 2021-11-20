import { toGlobalId } from 'graphql-relay';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { UserType } from '../types/user';
import { knex } from '../../db';

export const getUsers = {
	type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
	resolve() {
		const users =  knex.select().table('users');
		return users.map(
			(u: any) => {
				return {
					...u,
					id: toGlobalId('User', u.id),
				}
			}
		)
	}
}

export const user = {
	type: new GraphQLNonNull(UserType),
	async resolve() {
		// this user's credentials should come from an auth middleware, using a jwt token.
		const user = (await knex('users').where({id: 1}))[0];
		return {
			...user,
			id: toGlobalId('User', user.id),
		}
	}
}
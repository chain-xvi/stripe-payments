import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { getUsers, user } from './queries/user';
import { createUser, updatePlan, changePlan } from './mutations/user';

const Query = new GraphQLObjectType({
	name: 'Query',
	fields: {
		getUsers,
		user,
	}
})

const Mutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		createUser,
		updatePlan,
		changePlan,
	}
})

export const schema = new GraphQLSchema({
	query: Query,
	mutation: Mutation
});
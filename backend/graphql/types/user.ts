import { globalIdField, } from 'graphql-relay';

import {
	GraphQLNonNull,
	GraphQLInt,
} from 'graphql';

import { nodeInterface } from './nodeDef';

import {
	GraphQLObjectType,
	GraphQLID,
	GraphQLString,
} from 'graphql';

export const UserType = new GraphQLObjectType({
	name: 'User',
	fields: {
		id: globalIdField(),
		name: { type: GraphQLString },
		active_plan: { type: GraphQLString },
		email: { type: GraphQLString },
		created_at: {type: GraphQLString},
		customer_id: {type: GraphQLString},
		session_id: {type: GraphQLString},
	},
	interfaces: () => [nodeInterface],
})
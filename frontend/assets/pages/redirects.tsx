import React from 'react';
import qs from 'qs';
import History from '../data/history';

import {
	useMutation,
	graphql,
} from 'react-relay';

import type {redirectsUpdatePlanMutation} from './__generated__/redirectsUpdatePlanMutation.graphql';

export function Redirects(props) {

	const q = React.useMemo(() => {
		return qs.parse(props.location.search, {ignoreQueryPrefix: true});
	}, [props.location.search]);

	const [updatePlan, updating] = useMutation<redirectsUpdatePlanMutation>(
		graphql`
			mutation redirectsUpdatePlanMutation($id: String!){
				updatePlan(id: $id){
					id
					active_plan
				}
			}
		`
	);

	React.useEffect(
		function() {
			switch (props.match.params.source) {
				case "stripe":
					// update plan
					updatePlan({
						variables: {
							id: q.session_id,
						},
						onCompleted() {
							History.push('/');
						}
					});
					break;
				default:
					History.push('/');
					break;
			}
		}, []
	);

	return(
		<div className="redirects">
			Loading...
		</div>
	)
}
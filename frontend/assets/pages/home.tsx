import React, { Suspense, Fragment } from 'react';
import toast from 'react-hot-toast';
import './home.scss';

import {
	Card,
	Button,
	Modal,
} from '../components';

import {
	useLazyLoadQuery,
	graphql,
	useMutation,
} from 'react-relay';

const stripe = Stripe(`${process.env.STRIPE_PUBLISHABLE_KEY}`);

import type {homeUserQuery} from './__generated__/homeUserQuery.graphql';
import type {homeDowngradeMutation} from './__generated__/homeDowngradeMutation.graphql';
import type {homeUpgradeMutation} from './__generated__/homeUpgradeMutation.graphql';

export function Home() {
	return (
		<div className="homePage">
			<Suspense fallback="Loading...">
				<HomeContent />
			</Suspense>
		</div>
	)
}

function HomeContent() {
	// const [state, open, close] = Modal.useModalState();
	const [downPlan, setDownPlan] = React.useState<string|null>(null);
	const [upgrade, loading] = useMutation<homeUpgradeMutation>(
		graphql`
			mutation homeUpgradeMutation($price: String!, $plan: String!){
				changePlan(price: $price, plan: $plan){
					id
					active_plan
				}
			}
		`
	)

	const resp = useLazyLoadQuery<homeUserQuery>(
		graphql`
			query homeUserQuery{
				user{
					id
			    name
			    email
			    active_plan
			    customer_id
			    session_id
			    created_at
				}
			}
		`,
		{}
	);
	const user = resp.user;
	function upgradeMessage(toastId) {
		toast.dismiss(toastId);
		toast.success('Your plan was upgraded');
	}
	return (
		<Fragment>
			{
				downPlan && (
					<ModalDowngrade
						plan={downPlan}
						close={
							function() {
								setDownPlan(null);
							}
						}
					/>
				)
			}
			<h1>Manage your subscription</h1>
			<div className="pageContent">
				<Card title="Overview">
					<div className="text" children="Hello, this is an overview of your billing info."/>
						<div className="infos">
							<div className="info">
								<div className="title">Member since</div>
								<div className="subTitle">3 months ago</div>
							</div>
							<div className="info">
								<div className="title">Active plan</div>
								<div className="subTitle">
									{plans.find(p => user.active_plan === p.value)!.label}
								</div>
							</div>
						</div>
				</Card>
				<Card title="Plans">
					<div className="text" children="Hello, this is an overview of your billing info."/>
					<div className="plans">
						{
							plans.map(
								function(pl, i){
									const isActive = user.active_plan === pl.value;
									return (
										<div
											className={`plan ${isActive ? 'active' : ''}`}
											key={pl.value}
										>
											<div className="planMetaContainer">
												<div className="planMeta">
													<div className="label">{pl.label}</div>
													<PlanPrice className="priceContainer" monthlyPrice={pl.price}/>
												</div>
												{
													user.active_plan!.startsWith(pl.value) ? (
														<Button
															children="Current Plan"
															disabled
														/>
													) : (
														plans.findIndex(b => user.active_plan!.startsWith(b.value)) < i ? (
															<Button
																children="Upgrade Plan"
																spinOn={loading}
																primary
																onClick={
																	function () {
																		const toastId = toast.loading('Please wait...');
																		if(user.session_id && user.session_id !== ''){
																			upgrade({
																				variables:{
																					price: (pl.value === 'testproplan') ? process.env.PRO_PLAN : process.env.PREMIUM_PLAN,
																					plan: pl.value,
																				},
																				onCompleted() {
													                upgradeMessage(toastId);
																				}
																			});
																		} else {
																			createCheckoutSession(((pl.value === 'testproplan') ? process.env.PRO_PLAN : process.env.PREMIUM_PLAN) as string, user.email)
													            .then(
													              function(data) {
													                stripe
													                .redirectToCheckout({
													                  sessionId: data.sessionId
													                })
													                .then(
													                  function(response) {
													                  	upgradeMessage(toastId);
													                  }
													                );
													              }
													            );
																		}
																	}
																}
															/>
														) : (
															<Button
																children="Downgrade"
																onClick={
																	function() {
																		setDownPlan(pl.value);
																	}
																}
															/>
														)
													)
												}
											</div>
											<div className="planFeatures">
												{
													pl.features.map(
														function(plf, i) {
															return (
																<div className="planFeat" key={i}>
																	<span>✅</span>{plf}
																</div>
															)
														}
													)
												}
											</div>
										</div>
									)
								}
							)
						}
					</div>
				</Card>
			</div>
		</Fragment>
	)
}

function ModalDowngrade(props: { plan: string; close: () => void }) {
	const [downgrade, loading] = useMutation<homeDowngradeMutation>(
		graphql`
			mutation homeDowngradeMutation($price: String!, $plan: String!){
				changePlan(price: $price, plan: $plan){
					id
					active_plan
				}
			}
		`
	)

	return (
		<Modal close={props.close} >
			<div className="modalDowngrade">
				<Modal.Title>
					Downgrade Plan
				</Modal.Title>
				<Modal.Body className="modalBody">
					<div className="text">Are you sure you want to downgrade your plan?</div>
				</Modal.Body>
				<Modal.Footer className="modalFooter">
					<Button secondary className="cancelButton" onClick={props.close}>Cancel</Button>
					<Button
						primary
						children="Downgrade"
						spinOn={loading}
						onClick={
							function () {
								downgrade({
									variables:{
										price: (props.plan === 'testproplan') ? process.env.PRO_PLAN : process.env.PREMIUM_PLAN,
										plan: props.plan,
									},
									onCompleted(){
										props.close();
										toast.success('Your plan was downgraded');
									}
								});
							}
						}
					/>
				</Modal.Footer>
			</div>
		</Modal>
	)
}

function createCheckoutSession(priceId: string, customer_email: string) {
  return fetch(process.env.API + "create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      priceId,
      customer_email,
    })
  }).then(function(result) {
    return result.json();
  });
};

function PlanPrice(props: { className?: string; monthlyPrice: number }) {
	return (
		<div className={`price ${props.className || ''}`} >
			<sup>$</sup>{props.monthlyPrice}<span>/mo</span>
		</div>
	)
}

const plans = [
	{
		interval_unit:'month',
		price: 29,
		value: 'testproplan',
		label: "Pro Plan",
		text: 'All the basics features plus pro ones.',
		features: [
			`Features one`,
			`Features two`,
			`Features three`,
			`Features four`,
		]
	},
	{
		interval_unit:'month',
		price: 79,
		value: 'testbusinessplan',
		label: "Business Plan",
		text: 'You get everything with this plan.',
		features: [
			`Features one`,
			`Features two`,
			`Features three`,
			`Features four`,
		]
	},
];
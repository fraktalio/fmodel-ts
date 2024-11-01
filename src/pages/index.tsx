import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock'

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p>Functional and Algebraic Domain Modeling</p>
        <p><b>TypeScript</b></p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
                <HomepageFeatures/>
                <div className="container">
                    <CodeBlock
                        language="ts"
                        // title="A simplified model of an Order process:"
                        showLineNumbers>
                        {`
export const orderDecider: Decider<OrderCommand, Order | null, OrderEvent> =
  new Decider<OrderCommand, Order | null, OrderEvent>(
    (command, currentState) => {
      switch (command.kind) {
        case "CreateOrderCommand":
          return (currentState === null)
            ? [
              {
                version: 1,
                decider: "Order",
                kind: "OrderCreatedEvent",
                id: command.id,
                restaurantId: command.restaurantId,
                menuItems: command.menuItems,
                final: false,
              },
            ]
            : [
              {
                version: 1,
                decider: "Order",
                kind: "OrderNotCreatedEvent",
                id: command.id,
                restaurantId: command.restaurantId,
                menuItems: command.menuItems,
                final: false,
                reason: "Order already exist!",
              },
            ];
        case "MarkOrderAsPreparedCommand":
          return (currentState !== null && currentState.orderId === command.id)
            ? [
              {
                version: 1,
                decider: "Order",
                kind: "OrderPreparedEvent",
                id: currentState.orderId,
                final: false,
              },
            ]
            : [
              {
                version: 1,
                decider: "Order",
                kind: "OrderNotPreparedEvent",
                id: command.id,
                reason: "Order does not exist!",
                final: false,
              },
            ];
        default: {
          // Exhaustive matching of the command type
          const _: never = command;
          return [];
        }
      }
    },
    (currentState, event) => {
      switch (event.kind) {
        case "OrderCreatedEvent":
          return {
            orderId: event.id,
            restaurantId: event.restaurantId,
            menuItems: event.menuItems,
            status: "CREATED",
          };
        case "OrderNotCreatedEvent":
          return currentState;
        case "OrderPreparedEvent":
          return currentState !== null
            ? {
              orderId: currentState.orderId,
              restaurantId: currentState.restaurantId,
              menuItems: currentState.menuItems,
              status: "PREPARED",
            }
            : currentState;
        case "OrderNotPreparedEvent":
          return currentState;
        default: {
          // Exhaustive matching of the event type
          const _: never = event;
          return currentState;
        }
      }
    },
    null,
  );
                            `}
                    </CodeBlock>
                </div>
                <div className={styles.buttons}>
                    <Link
                        className="button button--primary button--lg"
                        to="/docs/intro">
                        Get Started
                    </Link>

                </div>
                <br/>
            </main>
    </Layout>
  );
}

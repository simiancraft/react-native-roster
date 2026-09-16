import { Fragment, type ReactNode, useEffect, useSyncExternalStore } from 'react';

const hosts = new Map<string, Map<string, ReactNode>>();
const listeners = new Set<() => void>();
const empty = new Map<string, ReactNode>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function publish(hostName: string, nodes: Map<string, ReactNode>) {
  if (nodes.size) hosts.set(hostName, nodes);
  else hosts.delete(hostName);
  for (const listener of listeners) listener();
}

/** Mount once at the destination for a named native portal. */
export function PortalHost({ name }: { name: string }) {
  const nodes = useSyncExternalStore(
    subscribe,
    () => hosts.get(name) ?? empty,
    () => empty,
  );
  return Array.from(nodes, ([key, node]) => <Fragment key={key}>{node}</Fragment>);
}

/** Register content at a named native host; caller context does not cross the store. */
export function Portal({
  hostName,
  name,
  children,
}: {
  hostName: string;
  name: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const nodes = new Map(hosts.get(hostName));
    nodes.set(name, children);
    publish(hostName, nodes);
    return () => {
      const nodes = new Map(hosts.get(hostName));
      nodes.delete(name);
      publish(hostName, nodes);
    };
  }, [hostName, name, children]);
  return null;
}

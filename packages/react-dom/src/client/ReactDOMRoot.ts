import type { ReactNodeList } from "shared/ReactTypes";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import type {
  Container,
  FiberRoot,
} from "react-reconciler/src/ReactInternalTypes";

type RootType = {
  render: (children: ReactNodeList) => void;
  _internalRoot: FiberRoot;
};

function ReactDOMRoot() {}

ReactDOMRoot.prototype.render = function (children: ReactNodeList) {};

export function createRoot(container: Container): RootType {
  return new ReactDOMRoot();
}

export default {
  createRoot,
};

import type { ReactNodeList } from "shared/ReactTypes";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import type {
  Container,
  FiberRoot,
} from "react-reconciler/src/ReactInternalTypes";
import { updateContainer } from "react-reconciler/src/ReactFiberReconciler";

type RootType = {
  render: (children: ReactNodeList) => void;
  _internalRoot: FiberRoot;
};

function ReactDOMRoot(_internalRoot: FiberRoot) {
  this._internalRoot = _internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
  updateContainer(children, this._internalRoot);
};

export function createRoot(container: Container): RootType {
  const root = createFiberRoot(container);

  return new ReactDOMRoot(root);
}

export default {
  createRoot,
};

import {
  CacheNode,
  ClientNode,
  DatabaseNode,
  LoadBalancerNode,
  ServerNode,
} from "../components/CustomNodes";
import SubflowNode from "../components/SubflowNode";

export const nodeTypes = {
  databaseNode: DatabaseNode,
  serverNode: ServerNode,
  clientNode: ClientNode,
  loadBalancerNode: LoadBalancerNode,
  cacheNode: CacheNode,
  subflowNode: SubflowNode,
};

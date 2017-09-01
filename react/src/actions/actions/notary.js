import {
  DASHBOARD_CONNECT_NOTARIES,
  DASHBOARD_GET_NOTARIES_LIST
} from '../storeType';
import { translate } from '../../translate/translate';
import { triggerToaster } from '../actionCreators';
import Config from '../../config';

function initNotaryNodesConSequence(nodes) {
  return dispatch => {
    Promise.all(nodes.map((node, index) => {
      const payload = {
        userpass: `tmpIgRPCUser@${sessionStorage.getItem('IguanaRPCAuth')}`,
        agent: 'dex',
        method: 'getinfo',
        symbol: node,
        timeout: 10000,
      };

      return new Promise((resolve, reject) => {
        fetch(`http://127.0.0.1:${(Config.useBasiliskInstance ? Config.iguanaCorePort + 1 : Config.iguanaCorePort)}/api/dex/getinfo?userpass=${('tmpIgRPCUser@' + sessionStorage.getItem('IguanaRPCAuth'))}&symbol=${node}`, {
          method: 'GET',
        })
        .catch(function(error) {
          console.log(error);
          dispatch(
            triggerToaster(
              `getInfoDexNode+${node}`,
              'Error',
              'error'
            )
          );
        })
        .then(response => response.json())
        .then(json => {
          dispatch(
            updateNotaryNodeConState(
              json,
              nodes.length,
              index,
              node
            )
          );
        })
      });
    }));
  }
}

function updateNotaryNodeConState(json, totalNodes, currentNodeIndex, currentNodeName) {
  if (currentNodeIndex === totalNodes - 1) {
    return dispatch => {
      dispatch(basiliskConnectionState(false));
    };
  } else {
    if (json &&
        json.error === 'less than required responses') {
      return {
        type: DASHBOARD_CONNECT_NOTARIES,
        total: totalNodes - 1,
        current: currentNodeIndex,
        name: currentNodeName,
        failedNode: currentNodeName,
      }
    } else {
      return {
        type: DASHBOARD_CONNECT_NOTARIES,
        total: totalNodes - 1,
        current: currentNodeIndex,
        name: currentNodeName,
      }
    }
  }
}

function connectAllNotaryNodes(json, dispatch) {
  if (json &&
      json.length) {
    dispatch(initNotaryNodesConSequence(json));

    return {
      type: DASHBOARD_CONNECT_NOTARIES,
      total: json.length - 1,
      current: 0,
      name: json[0],
    }
  }
}

export function connectNotaries() {
  const payload = {
    userpass: `tmpIgRPCUser@${sessionStorage.getItem('IguanaRPCAuth')}`,
    agent: 'dpow',
    method: 'notarychains',
  };

  return dispatch => {
    return fetch(`http://127.0.0.1:${Config.iguanaCorePort}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .catch(function(error) {
      console.log(error);
      dispatch(
        triggerToaster(
          'connectNotaries',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(
      json => dispatch(
        connectAllNotaryNodes(json, dispatch)
      )
    )
  }
}

function getDexNotariesState(json) {
  if (json.error === 'less than required responses') {
    return dispatch => {
      dispatch(
        triggerToaster(
          translate('TOASTR.LESS_RESPONSES_REQ'),
          translate('TOASTR.BASILISK_NOTIFICATION'),
          'error'
        )
      );
    }
  } else {
    return {
      type: DASHBOARD_GET_NOTARIES_LIST,
      notaries: json,
    }
  }
}

export function getDexNotaries(coin) {
  const payload = {
    userpass: `tmpIgRPCUser@${sessionStorage.getItem('IguanaRPCAuth')}`,
    agent: 'dex',
    method: 'getnotaries',
    symbol: coin,
  };

  return dispatch => {
    return fetch(`http://127.0.0.1:${Config.useBasiliskInstance ? Config.iguanaCorePort + 1 : Config.iguanaCorePort}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    .catch(function(error) {
      console.log(error);
      dispatch(
        triggerToaster(
          'getDexNotaries',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      dispatch(getDexNotariesState(json));
    })
  }
}
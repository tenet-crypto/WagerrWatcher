/**
 * Web Worker
 * Handles the requesting of data in a separate thread
 * to prevent UI pausing.
 */

/**
 * Global configuration object.
 */
require('babel-polyfill');
const Promise = require('bluebird');
const config = require('../config');
const fetch = require('./fetch');

const api = `${ config.api.host }${ config.api.prefix }`;

// Get the address and all transactions related.
const getAddress = ({ address, ...query}) => fetch(`${ api }/address/${ address }`, query);

// Get the block and transactions.
const getBlock = query => fetch(`${ api }/block/${ query }`);

// Request the coins.
const getCoins = async (query) => {
  try {
    const coins = await fetch(`${ api }/coin/history`, query);
    const avgBlockTime = await fetch(`${ api}/block/average`);
    const avgMNTime = await fetch(`${ api }/masternode/average`);

    return Promise.resolve(coins.map(c => ({ ...c, avgBlockTime, avgMNTime })));
  } catch(err) {
    console.log('fetch.worker ERROR:', err);
    return Promise.reject(err);
  }
};

// Request the coins for a week.
const getCoinsWeek = query => fetch(`${ api }/coin/week`, query);

// Check if hash is a block.
const getIsBlock = query => fetch(`${ api }/block/is/${ query }`);

// Request the list of masternodes.
const getMNs = query => fetch(`${ api }/masternode`, query);

// Request the list of connected peers.
const getPeers = () => fetch(`${ api }/peer`);

// Get the top 100 wallets.
const getTop100 = () => fetch(`${ api }/top100`);

// Get transaction by its hash.
const getTX = query => fetch(`${ api }/tx/${ query }`);

// Request the transactions.
const getTXs = query => fetch(`${ api }/tx`, query);

// Request the transactions for a week.
const getTXsWeek = query => fetch(`${ api }/tx/week`, query);

// Request the latest transactions.
const getTXsLatest = query => fetch(`${ api }/tx/latest`, query);

const getListEvents = query => fetch(`${ api }/bet/listevents`, query);

const getBetActionsWeek = query => fetch(`${ api }/bet/action/week`, query);

const getBetEvents = query => fetch(`${ api }/bet/events?eventId=${ query }`);

const getBetQuery = query => fetch(`${ api }/bet/events/query`, query);

const getBetActions = query => fetch(`${ api }/bet/actions?eventId=${ query }`);

const getBetResults = query => fetch(`${ api }/bet/results?eventId=${ query }`);

const getBetspreads = query => fetch(`${ api }/bet/spreads?eventId=${ query }`);

const getBetTotals = query => fetch(`${ api }/bet/totals?eventId=${ query }`);

const getBetUpdates = query => fetch(`${ api }/bet/updates?eventId=${ query }`);

const getBetEventInfo = query => fetch(`${ api }/bet/event/${ query }/info`);

const getBetEventsInfo = query => fetch(`${ api }/bet/events/info`, query);

const getBetParlaysInfo = query => fetch(`${ api }/bet/parlaybets`, query);

const getCurrentPps = query => fetch(`${ api }/pps/current`, query);

const getBetPerWeek = query => fetch(`${ api }/statistic/perweek`, query);

const getOpCode = query => fetch(`${ api }/opcodes/${query}`);

// Request lotto data
// const getLottoEvents = query => fetch(`${ api }/lotto/events?eventId=${ query }`);
const getLottoEvents = query => fetch(`${ api }/lotto/events`, query);
const getLottoBets = query => fetch(`${ api }/lotto/bets?eventId=${ query }`);
const getLottoResults = query => fetch(`${ api }/lotto/results?eventId=${ query }`);

const getLottoEventInfo = query => fetch(`${ api }/lotto/event/${ query }/info`);



// Handle incoming messages.
self.addEventListener('message', (ev) => {
  let action = null;  
  switch (ev.data.type) {
    case 'address':
      action = getAddress;
      break;
    case 'block':
      action = getBlock;
      break;
    case 'coins':
      action = getCoins;
      break;
    case 'coins-week':
      action = getCoinsWeek;
      break;
    case 'is-block':
      action = getIsBlock;
      break;
    case 'peers':
      action = getPeers;
      break;
    case 'mns':
      action = getMNs;
      break;
    case 'top-100':
      action = getTop100;
      break;
    case 'tx':
      action = getTX;
      break;
    case 'txs':
      action = getTXs;
      break;
    case 'txs-latest':
      action = getTXsLatest;
      break;
    case 'txs-week':
      action = getTXsWeek;
      break;
    case 'listevents':
      action = getListEvents;
      break;
    case 'betactions-week':
      action = getBetActionsWeek;
      break;
    case 'betevents':
      action = getBetEvents;
      break;
    case 'beteventquery':
      action = getBetQuery;
      break;
    case 'betactions':
      action = getBetActions;
      break;
    case 'betresults':
      action = getBetResults;
      break;
    case 'betspreads':
      action = getBetspreads;
      break;
    case 'bettotals':
      action = getBetTotals;
      break;
    case 'betupdates':
      action = getBetUpdates;
      break;      
    case 'beteventinfo':
      action = getBetEventInfo;
      break;
    case 'beteventsinfo':
      action = getBetEventsInfo;
      break;
    case 'betparlaysinfo':
      action = getBetParlaysInfo;
      break;
    case 'currentpps':
      action = getCurrentPps;
      break;
    case 'betperweek':
      action = getBetPerWeek;
      break;
    case 'opcode':
      action = getOpCode;
      break;
    case 'lottoevents':
      action = getLottoEvents;
      break;
    case 'lottobets':
      action = getLottoBets;
      break;
    case 'lottoresults':
      action = getLottoResults;
      break;
    case 'lottoeventinfo':
      action = getLottoEventInfo;
      break;
  }

  const wk = self;
  if (!action) {
    return wk.postMessage({ error: new Error('Type not found!') });
  }

  action(ev.data.query)
    .then((data) => {
      return wk.postMessage({ data, type: ev.data.type });
    })
    .catch((err) => {
      return wk.postMessage({ ...err, type: ev.data.type });
    });
});
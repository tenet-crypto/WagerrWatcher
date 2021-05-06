const express = require('express');
const blockex = require('../handler/blockex');
const faucet = require('../handler/faucet');
const iquidus = require('../handler/iquidus');
const custom = require('../handler/custom');
const opCode = require('../handler/opcode');
const raw = require('../handler/raw');

const router = express.Router();

router.get('/address/:hash', blockex.getAddress);
router.get('/block/average', blockex.getAvgBlockTime());
router.get('/block/is/:hash', blockex.getIsBlock);
router.get('/block/:hash', blockex.getBlock);
router.get('/coin', blockex.getCoin);
router.get('/coin/history', blockex.getCoinHistory);
router.get('/coin/week', blockex.getCoinsWeek());
router.get('/masternode', blockex.getMasternodes);
router.get('/masternode/average', blockex.getAvgMNTime());
router.get('/masternode/:hash', blockex.getMasternodeByAddress);
router.get('/masternodecount', blockex.getMasternodeCount);
router.get('/peer', blockex.getPeer);
router.get('/supply', blockex.getSupply);
router.get('/top100', blockex.getTop100);
router.get('/tx', blockex.getTXs);
router.get('/tx/latest', blockex.getTXLatest);
router.get('/tx/week', blockex.getTXsWeek());
router.get('/tx/:hash', blockex.getTX);
router.get('/bet/listevents', blockex.getListEvents);
router.get('/bet/events', blockex.getBetEvents);
router.get('/bet/openevents', blockex.getBetOpenEvents);
router.get('/bet/hotevents', blockex.getBetHotEvents);
router.get('/bet/events/query', blockex.getBetQuery);
router.get('/bet/actions', blockex.getBetActions);
router.get('/bet/latest_actions', blockex.getBetLatestActions);
router.get('/bet/results', blockex.getBetResults);
router.get('/bet/spreads', blockex.getBetspreads);
router.get('/bet/totals', blockex.getBetTotals);
router.get('/bet/moneyline', blockex.getBetUpdates);
router.get('/bet/event/:eventId/info', blockex.getBetEventInfo);
router.get('/bet/events/info', blockex.getBetEventsInfo);
router.get('/bet/parlaybets', blockex.getBetParlayBetsInfo);
router.get('/bet/stats', blockex.getBetStats);
router.get('/bet/totalUSD', blockex.getBettotalUSD);
router.get('/bet/team-events', blockex.getTeamEventInfo);
router.get('/bet/action/week', blockex.getBetActioinsWeek());
router.get('/bet/infobypayout', blockex.getBetInfoByPayout);
router.get('/pps/current', blockex.getCurrentProposals);
router.get('/statistic/perweek', blockex.getStatisticPerWeek());

// Lotto routes
router.get('/lotto/events', blockex.getLottoEvents);
router.get('/lotto/bets', blockex.getLottoBets);
router.get('/lotto/results', blockex.getLottoResults);
router.get('/lotto/event/:eventId/info', blockex.getLottoEventInfo);

// faucet
router.get('/faucet/donate', faucet.donate);

// Iquidus Explorer routes.
router.get('/getdifficulty', iquidus.getdifficulty);
router.get('/getconnectioncount', iquidus.getconnectioncount);
router.get('/getblockcount', iquidus.getblockcount);
router.get('/getblockhash', iquidus.getblockhash);
router.get('/getblock', iquidus.getblock);
router.get('/getrawtransaction', iquidus.getrawtransaction);
router.get('/getnetworkhashps', iquidus.getnetworkhashps);

// Custom
router.get('/custom/betstatus', custom.getBetStatus);
router.get('/custom/supply', custom.getCustomSupply);
router.get('/custom/totalpayout', custom.getTotalPayout);
router.get('/custom/getaddressesinfo/:hashlist', custom.getAddressesInfo);
router.get('/custom/getunspenttransactions/:hashlist', custom.getunspenttransactions);

// OpCode decryption
router.get('/opcodes/:hex_value', opCode.decodeOP);

router.get('/getblockbyhash', raw.getblockbyhash);

router.get('/gettransaction', raw.gettransaction);

router.get('/getunspenttransactions', raw.getunspenttransactions);

router.get('/getfeeinfo', raw.getfeeinfo);

router.get('/getblocktransactions', raw.getblocktransactions);

router.post('/sendrawtransaction', raw.sendRawTransaction);

router.get('/getaddresstransactioncount/:hash', raw.getAddress);

module.exports =  router;
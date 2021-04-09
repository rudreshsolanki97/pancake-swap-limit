const Web3 = require("web3");

/**
 *
 * CONSTANT Desclaration Starts
 *
 */

const RPC_PROVIDER = "https://bsc-dataseed.binance.org/";

const PRICE_CHECK_INTERVAL = 5 * 1000;
const PAIR_ADDRESS = "0x19e7cbECDD23A16DfA5573dF54d98F7CaAE03019";
const PAIR_ABI = require("./contract/PancakeLP.json");

const PATH = ["0x19e7cbECDD23A16DfA5573dF54d98F7CaAE03019"];
const ROUTER_ADDRESS = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F";
const ROUTER_ABI = require("./contract/PancakeSwapRouter.json");
const { GetOrders, RemoveOrder } = require("./Order");
const DECIMALS = 10 ** 18;

// User's address
const WALLET_ADDRESS = "0xb0CDc57282CF4D327537Db69c48717449fe13E37";
const WALLET_PRIVATE_KEY = "";

const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const EGG = "0xf952fc3ca7325cc27d15885d37117676d25bfda6";

const BUSD_EGG_PATH = [BUSD, EGG];
const EGG_BUSD_PATH = [EGG, BUSD];

const TOKEN_0 = "BUSD",
  TOKEN_1 = "EGG";

/**
 *
 * CONSTANT Desclaration Ends
 *
 */

const web3 = new Web3(new Web3.providers.HttpProvider(RPC_PROVIDER));
const router_inst = new web3.eth.Contract(ROUTER_ABI, ROUTER_ADDRESS);
const pair_inst = new web3.eth.Contract(PAIR_ABI, PAIR_ADDRESS);

const invert = (amnt) => 1 / amnt;

const getCurrentPrice = (invert = false) => {
  return new Promise((resolve, reject) => {
    pair_inst.methods
      .getReserves()
      .call()
      .then((resp) => {
        const { _reserve0, _reserve1 } = resp;
        const _0_to_1 = (_reserve1 * 998) / _reserve0 / 1000;
        if (invert === true) return resolve(invert(_0_to_1));
        return resolve(_0_to_1);
      })
      .catch((e) => reject(e));
  });
};

/**
 *
 * ensure tkn_0  amount - while buying
 *
 * @param {*} tkn_0 amount in ( tkn_0 )
 * @param {*} tkn_1 min amount out ( tkn_1 )
 * @param {*} deadline in seconds
 */
const placeSwapExactTkn4Tkns = (tkn_0, tkn_1, path, deadline) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = router_inst.methods
        .swapExactTokensForTokens(tkn_0, tkn_1, path, WALLET_ADDRESS, deadline)
        .encodeABI();
      const tx = { to: ROUTER_ADDRESS, data: data };
      const gasLimit = await web3.eth.estimateGas(tx);
      tx.gasLimit = gasLimit;
      const signed = await web3.eth.accounts.signTransaction(
        tx,
        WALLET_PRIVATE_KEY
      );
      web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .once("receipt", (resp) => {
          console.log("receipt", resp);
          resolve(resp);
        });
    } catch (e) {
      reject(e);
    }
  });
};

// /**
//  *
//  * BUY BUSD
//  * ensure tkn_2  amount - while selling
//  *
//  * @param {*} tkn_0 amount out ( tkn_0 )
//  * @param {*} tkn_1 max amount in ( tkn_1 )
//  * @param {*} deadline in seconds
//  */
// const placeSwapTkns4ExactTkn = (tkn_0, tkn_1, deadline) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const data = router_inst.methods
//         .swapTokensForExactTokens(tkn_0, tkn_1, PATH, WALLET_ADDRESS, deadline)
//         .encodeABI();
//       const tx = { to: ROUTER_ADDRESS, data: data };
//       const gasLimit = await web3.eth.estimateGas(tx);
//       tx.gasLimit = gasLimit;
//       const signed = await web3.eth.accounts.signTransaction(
//         tx,
//         WALLET_PRIVATE_KEY
//       );
//       web3.eth
//         .sendSignedTransaction(signed.rawTransaction)
//         .once("receipt", (resp) => {
//           console.log("receipt", resp);
//           resolve(resp);
//         });
//     } catch (e) {
//       reject(e);
//     }
//   });
// };

exports.RenderCurrentPrice = async () => {
  try {
    const _0_to_1 = await getCurrentPrice();
    const _1_to_0 = invert(_0_to_1);

    console.log("\tPrices");

    console.log("\t\tToken BUSD to EGG", _0_to_1);
    console.log("\t\tToken EGG to BUSD", _1_to_0);
    return;
  } catch (e) {
    console.log(e);
  }
};

setInterval(async () => {
  try {
    const _0_to_1 = await getCurrentPrice();
    const _1_to_0 = invert(_0_to_1);

    const orders = GetOrders();
    const curTime = Date.now();

    for (let order of orders) {
      let price, path, deadline;

      if (order.deadline < curTime) {
        continue;
      }

      deadline = Math.floor(order.deadline / 1000);

      if (order.pair === "BUSD-EGG") {
        price = _0_to_1;
        const requestedPrice = order.amount0 / order.amount1;
        if (requestedPrice < price) continue;
        path = BUSD_EGG_PATH;
      } else {
        price = _1_to_0;
        const requestedPrice = order.amount1 / order.amount0;
        if (requestedPrice > price) continue;
        path = EGG_BUSD_PATH;
      }

      RemoveOrder(order.id);

      const resp = await placeSwapExactTkn4Tkns(
        order.amount0,
        order.amount1,
        path,
        order.deadline
      );

      console.log("order placed", resp);
    }
  } catch (e) {
    console.log(e);
  }
}, PRICE_CHECK_INTERVAL);

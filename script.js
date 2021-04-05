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
const DECIMALS = 10 ** 18;

// User's address
const WALLET_ADDRESS = "0xb0CDc57282CF4D327537Db69c48717449fe13E37";
const WALLET_PRIVATE_KEY = "";

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
 * ensure tkn_1  amount - while buying
 *
 * @param {*} tkn_0 amount in ( tkn_0 )
 * @param {*} tkn_1 min amount out ( tkn_1 )
 * @param {*} deadline in seconds
 */
const placeSwapExactTkn4Tkns = (tkn_0, tkn_1, deadline) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = router_inst.methods
        .swapExactTokensForTokens(tkn_0, tkn_1, PATH, WALLET_ADDRESS, deadline)
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

/**
 *
 * ensure tkn_2  amount - while selling
 *
 * @param {*} tkn_0 amount out ( tkn_0 )
 * @param {*} tkn_1 max amount in ( tkn_1 )
 * @param {*} deadline in seconds
 */
const placeSwapTkns4ExactTkn = (tkn_0, tkn_1, deadline) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = router_inst.methods
        .swapTokensForExactTokens(tkn_0, tkn_1, PATH, WALLET_ADDRESS, deadline)
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

setInterval(async () => {
  try {
    const _0_to_1 = await getCurrentPrice();
    const _1_to_0 = invert(_0_to_1);

    console.log("\tPrices");

    console.log("\t\tToken 0 to 1", _0_to_1);
    console.log("\t\tToken 1 to 0", _1_to_0);
  } catch (e) {
    console.log(e);
  }
}, PRICE_CHECK_INTERVAL);

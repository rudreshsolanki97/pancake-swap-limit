const inquirer = require("inquirer");
const _ = require("lodash");

inquirer.registerPrompt("datepicker", require("inquirer-datepicker"));

const Order = require("./Order");
const { RenderCurrentPrice } = require("./script");

const onlyNumber = (value) => {
  return !isNaN(parseFloat(value));
};

function renderDeadline(x) {
  const date = new Date(x);
  const hrs = date.getHours(),
    mins = date.getMinutes(),
    days = date.getDate(),
    month = date.getMonth() + 1,
    year = date.getFullYear();

  return `${days}/${month}/${year} ${hrs}:${mins}`;
}

function renderOrder(orders) {
  const header = "||  ID  ||  Pair  |  Amount0  |  Amount1  |  Deadline  ||\n";
  let resp = header;
  if (orders.length === 0) return resp;
  for (let { pair, amount0, amount1, deadline, id } of orders) {
    resp += `||  ${id}  ||  ${pair}  |  ${amount0}  |  ${amount1}  |  ${renderDeadline(
      deadline
    )}  ||\n`;
  }
  return resp;
}

const obj = {
  ShowPrice: "Show Current Price",
  ShowOrder: "Show Current Order",
  NewTrade: "New Order",
  CancelTrade: "Cancel Order",
  StopScript: "Stop Script",
};

async function MainMenu() {
  const tradeMenu = [
    {
      type: "list",
      name: "choice",
      message: "Main Menu",
      choices: [
        obj.ShowPrice,
        obj.ShowOrder,
        obj.NewTrade,
        obj.CancelTrade,
        obj.StopScript,
      ],
    },
  ];

  const { choice } = await inquirer.prompt(tradeMenu);
  switch (choice) {
    case obj.ShowPrice: {
      await RenderCurrentPrice();
      break;
    }
    case obj.ShowOrder: {
      const orders = Order.GetOrders();
      console.log(renderOrder(orders));
      break;
    }
    case obj.NewTrade: {
      const TradeDetails = await GetTradeDetails();
      Order.AddOrder({ ...TradeDetails });
      break;
    }
    case obj.CancelTrade: {
      const { id } = await RemoveOrderDetails();
      Order.RemoveOrder(parseInt(id));
      break;
    }
    case obj.StopScript: {
      process.exit(0);
    }
    default: {
      break;
    }
  }
  MainMenu();
}

function GetTradeDetails() {
  const tradeMenu = [
    {
      type: "list",
      name: "pair",
      message: "Order Type",
      choices: ["BUSD-EGG", "EGG-BUSD"],
    },
    {
      type: "input",
      name: "amount0",
      message: (answers) => `Amount in terms of ${answers.pair.split("-")[0]}?`,
      validate: onlyNumber,
    },
    {
      type: "input",
      name: "amount1",
      message: (answers) =>
        `Minimum Out Amount in terms of ${answers.pair.split("-")[1]}?`,
      validate: onlyNumber,
    },
    {
      type: "datepicker",
      name: "deadline",
      message: "Valid Until",
      default: new Date(),
    },
  ];

  return inquirer.prompt(tradeMenu);
}

function RemoveOrderDetails() {
  const tradeMenu = [
    {
      type: "input",
      name: "id",
      message: (answers) => `Order ID?`,
      validate: onlyNumber,
    },
  ];

  return inquirer.prompt(tradeMenu);
}

MainMenu();

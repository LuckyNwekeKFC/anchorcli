import {
  createExecMenu,
  createQueryMenu,
  getLCDClient,
  handleExecCommand,
  handleQueryCommand,
} from '../../util/contract-menu';
import { CLIKey } from '@terra-money/terra.js/dist/key/CLIKey';
import {
  fabricatebCustodyConfig,
  fabricateCustodyWithdrawCollateral,
} from '@anchor-protocol/anchor.js/dist/fabricators';
import {
  AddressProviderFromJSON,
  resolveChainIDToNetworkName,
} from '../../addresses/from-json';
import {
  queryCustodyBorrower,
  queryCustodyBorrowers,
  queryCustodyConfig,
} from '@anchor-protocol/anchor.js/dist/queries';
import * as Parse from '../../util/parse-input';
import accAddress = Parse.accAddress;
import int = Parse.int;

const menu = createExecMenu(
  'custody',
  'Anchor MoneyMarket Custody contract functions',
);

interface Config {
  liquidationContract?: string;
}

const updateConfig = menu
  .command('update-config')
  .description('Updates the configuration of the Custody contract')
  .option(
    '--liquidation-contract <AccAddress>',
    'New contract address of Liquidation Contract',
  )
  .action(async ({ liquidationContract }: Config) => {
    const key = new CLIKey({ keyName: menu.from });
    const userAddress = key.accAddress;
    const addressProvider = new AddressProviderFromJSON(
      resolveChainIDToNetworkName(menu.chainId),
    );
    const msg = fabricatebCustodyConfig({
      address: userAddress,
      custody: 'custody',
      liquidation_contract: liquidationContract,
    })(addressProvider);
    await handleExecCommand(menu, msg);
  });

interface Withdraw {
  amount?: string;
}

const withdraw_collateral = menu
  .command('withdraw-collateral')
  .description('Withdraw specified amount of spendable collateral')
  .requiredOption('--amount <string>', '')
  .action(async ({ amount }: Withdraw) => {
    const key = new CLIKey({ keyName: menu.from });
    const userAddress = key.accAddress;
    const addressProvider = new AddressProviderFromJSON(
      resolveChainIDToNetworkName(menu.chainId),
    );
    let redeem_all = false;
    if (amount === undefined) {
      redeem_all = true;
    }

    const msg = fabricateCustodyWithdrawCollateral({
      address: userAddress,
      market: 'custody',
      amount: amount,
    })(addressProvider);
    await handleExecCommand(menu, msg);
  });

const query = createQueryMenu('custody', 'Anchor custody contract queries');

interface Borrower {
  address: string;
}

const getBorrower = query
  .command('borrower')
  .description('Get the collateral balance of the specified borrower')
  .requiredOption(
    '--address <AccAddress>',
    'Address of borrower that deposited collateral',
  )
  .action(async ({ address }: Borrower) => {
    const lcd = getLCDClient();
    const addressProvider = new AddressProviderFromJSON(
      resolveChainIDToNetworkName(query.chainId),
    );
    const queryBorrower = await queryCustodyBorrower({
      lcd,
      custody: 'custody',
      address: accAddress(address),
    })(addressProvider);
    await handleQueryCommand(query, queryBorrower);
  });

interface Borrowers {
  startAfter?: string;
  limit?: string;
}

const getBorrowers = query
  .command('borrowers')
  .description('Get the collateral balance of all borrowers')
  .option('--start-after <AccAddress>', 'Borrower address to start query')
  .option('--limit <int>', 'Maximum number of query entries')
  .action(async ({ startAfter, limit }: Borrowers) => {
    const lcd = getLCDClient();
    const addressProvider = new AddressProviderFromJSON(
      resolveChainIDToNetworkName(query.chainId),
    );
    const queryBorrowers = await queryCustodyBorrowers({
      lcd,
      custody: 'custody',
      startAfter: accAddress(startAfter),
      limit: int(limit),
    })(addressProvider);
    await handleQueryCommand(query, queryBorrowers);
  });

const getConfig = query
  .command('config')
  .description('Get the contract configuration of the Custody contract')
  .action(async ({}: Config) => {
    const lcd = getLCDClient();
    const addressProvider = new AddressProviderFromJSON(
      resolveChainIDToNetworkName(query.chainId),
    );
    const queryConfig = await queryCustodyConfig({
      lcd,
      custody: 'custody',
    })(addressProvider);
    await handleQueryCommand(query, queryConfig);
  });

export default {
  query,
  menu,
};
import axios from "axios";
import _ from "lodash";


const calulateController = {


    calculate: async (req, res) => {

        const { hashrate, power, costPerKwh  } = req.body;


        const result = await axios.get('https://api.minerstat.com/v2/coins?list=BTC')

        if(result && _.size(result) !== 0) {

            const data = result.data[0]

            const SECONDS_PER_DAY = 86400;
            const BLOCK_REWARD = data?.reward_block;
            const NETWORK_HASHRATE = data?.network_hashrate;

            const fees = 1; // Fees in percentage
            const DAYS_PER_MONTH = 30.44; // Average number of days per month

            // Convert hashrate from TH/s to H/s
            const hashrateHs = hashrate * 1e12;

            // Calculate the miner's share of the network hashrate
            const minerShare = hashrateHs / (data?.difficulty * 2**32 / 600);

            // Calculate the daily number of blocks found by the miner
            const minerDailyBlocks = minerShare * (SECONDS_PER_DAY / 600);

            // Calculate daily revenue in BTC
            const dailyBtcRevenue = minerDailyBlocks * BLOCK_REWARD;

            // Calculate the daily revenue in USD
            const dailyUsdRevenue = dailyBtcRevenue * data?.price.toFixed(2);

            // Calculate power consumption cost
            const dailyPowerCost = (power * 24 / 1000) * costPerKwh;

            // Calculate the fees
            const dailyFees = dailyUsdRevenue * (fees / 100);

            // Calculate net daily revenue
            const netDailyRevenue = (dailyUsdRevenue - dailyPowerCost - dailyFees).toFixed(2);

            // Calculate net monthly revenue
            const netMonthlyRevenue = (netDailyRevenue * DAYS_PER_MONTH).toFixed(2);
            res.status(200).send({ message: 'Calculate Monthly revenue', netMonthlyRevenue: netMonthlyRevenue, netDailyRevenue: netDailyRevenue });
        }
        else {
            res.status(500).send({ message: 'Internal Server Error', status: 500 });
        }


    }

}

export default calulateController
<template>
    
    <div class="q-pa-md">

<!--      
      <div class="row q-gutter-md">
        <div class="col-12 col-md">
          <CBigLabel ref='label_btc_up' title="btc_up"></CBigLabel>
        </div>
        <div class="col-12 col-md">
          <CBigLabel ref='label_btc_down' title="abc"></CBigLabel>
        </div>
        <div class="col-12 col-md">
          <CBigLabel ref='label_eth_up' title="abc"></CBigLabel>
        </div>
        <div class="col-12 col-md">
          <CBigLabel ref='label_eth_down' title="abc"></CBigLabel>
        </div>
      </div>
-->

        <CTitle ttype='title' :title="$t ('page.cwatch.title')" :desc="$t ('page.cwatch.desc')" ></CTitle>
        <div class="row text-center q-mb-lg">
            <div class="col box_knob" v-for="(a_item,index) in v_risk">
                <div class="knob_title">{{ a_item.label }}</div>
                <q-knob
                    show-value readonly font-size="16px" class="text-red"
                    :min="0" :max="10"
                    v-model="a_item.value" size="80px" :thickness="0.3"                            
                    :color="a_item.color" track-color="grey-3">
                    <q-icon :name="a_item.icon" class="q-mr-xs box_knob" />
                    {{ a_item.value }}
                </q-knob>
            </div>
        </div>

        <q-separator class="gSeparator" />

        <div>
            <CTitle ttype='subtitle' :title="$t ('page.cwatch.subtitle.title')" :desc="$t ('page.cwatch.subtitle.desc')" ></CTitle>          
            <ChartTimeframe period='daily' :onclick="onClickTimeframe" :selected='g_timeframe'></ChartTimeframe>          
            <CWatchChart ref='cwatchChart'></CWatchChart>
        </div>      

  </div> 


</template>

<script>
import { Config } from 'src/data/Config';
import { CONST } from 'src/data/const';
import CommonFunc from 'src/util/CommonFunc';
import logger from 'src/error/Logger';
import APIService from 'src/services/apiService';
import DataService from 'src/services/dataService';
import { LoadingBar } from 'quasar';

import CTitle from 'components/CTitle';
import CBigLabel from 'components/CBigLabel';
import ChartTimeframe from 'components/ChartTimeframe';
import CWatchChart from 'pages/cwatch/components/CWatchChart';


export default {
  name: 'PageCWatch',
  components: {
      CTitle,
      CBigLabel,
      ChartTimeframe,
      CWatchChart,
  },

    data: function () {
        return {
            g_data:null,
            g_data_oracle:null,
            g_timeframe: 'm1',

            v_page: {title: this.$t('page.cwatch.title'), desc:'' },
            v_risk: [
                {label:'BTC_UP', value:0, color:'green'},
                {label:'BTC_DOWN', value:0, color:'green'},
                {label:'ETH_UP', value:0, color:'green'},
                {label:'ETH_DOWN', value:0, color:'green'},
            ]
        }
    },
    created: function () {
        //console.log("HomeView.created");
    },
    mounted: function() {
        //console.log("HomeView.mounted - ");
        this.refresh();
    },
    updated: function() {
        //console.log("HomeView.updated");
    },
    
    methods: {
        updatePageHeader: function(json_data) {
            const dic_columns = CommonFunc.getColumnDic(json_data['BTC'].columns,[],[]);
            let watch_date = json_data['BTC'].values[json_data['BTC'].values.length-1][dic_columns['utc_trade_date']];
            this.v_page.desc = watch_date;
        },



        updateAlert: function(data) {
            logger.log.debug('updteAlert - ',data);
            this.g_data_watch = data;

            let dic_columns = CommonFunc.getColumnDic(data['BTC'].columns,[],[]);            
            let btc_down = CommonFunc.getCWatchValueAndColor(data['BTC'].values[data['BTC'].values.length-1][dic_columns['rise_prob']]);
            let eth_down = CommonFunc.getCWatchValueAndColor(data['ETH'].values[data['ETH'].values.length-1][dic_columns['rise_prob']]);
            let btc_up = CommonFunc.getCWatchValueAndColor(data['BTC'].values[data['BTC'].values.length-1][dic_columns['fall_prob']]);
            let eth_up = CommonFunc.getCWatchValueAndColor(data['ETH'].values[data['ETH'].values.length-1][dic_columns['fall_prob']]);

            this.v_risk = [
                {label:'BTC_UP', value:btc_up.value, color:btc_up.color, icon:btc_up.icon},
                {label:'ETH_UP', value:eth_up.value, color:eth_up.color, icon:eth_up.icon},
                {label:'BTC_DOWN', value:btc_down.value, color:btc_down.color, icon:btc_down.icon},
                {label:'ETH_DOWN', value:eth_down.value, color:eth_down.color, icon:eth_down.icon},
            ];
        },

        refresh() {
            const _this = this;
        
            LoadingBar.start();
            let funcs = [            
                //this.loadCalendarEffectData('1h'),
                this.loadCryptoWatchData(),
                //this.loadCryptoOracleData(30),
            ];
            Promise.all(funcs).then(function() {
                LoadingBar.stop();
            });

        },
        

        loadCryptoWatchData(ioffset=30) {
            const _this = this;

            DataService.loadCryptoWatchData(ioffset).then(function(data) {
                _this.g_data = data;
                _this.updatePageHeader(_this.g_data);
                //_this.updateWidget(_this.g_data);
                _this.updateCwatchChart(_this.g_data);
                _this.updateAlert(_this.g_data);
            });
        },
        

        loadCryptoOracleData(ioffset=100) {
            const _this = this;

            return new Promise(function(resolve,reject) {
                let a_today = CommonFunc.getToday(false);
                let a_start_date = CommonFunc.addDays(a_today, ioffset*-1 );
                //let a_end_date = CommonFunc.addDays(a_today, 1 );
                
                let dic_param = { freq:'1H',start_date:a_start_date, thresh:'3' };
                logger.log.debug("CWatchView.loadCryptoOracleData - dic_param=",dic_param);

                APIService.getCryptoOracleData(dic_param,function(response) {
                    _this.g_data_oracle = response.data.data;
                    logger.log.debug("CWatchView.loadCryptoOracleData - response",_this.g_data_oracle);
                    
                    _this.updateOracleChart(_this.g_data_oracle);
                    resolve();
                },function(err) {
                    logger.log.error("HomeView.loadCryptoOracleData - error",err);
                    reject();
                });
            });            
        },
        

        updateWidget(data,n_recent=3) {

            let dic_columns = CommonFunc.getColumnDic(data['BTC'].columns,[],[]);            
            let n_count = data['BTC'].values.length;
            
            let dic_count = {'BTC':{'up':0,'down':0},'ETH':{'up':0,'down':0}};

            for (let asset in dic_count) {                
                for (let index=n_count-n_recent;index<n_count;index++) {
                    if (data[asset].values[index][dic_columns['short_usd_z']]>this.g_thresh) {
                        dic_count[asset]['up'] +=  1;
                    } 
                    if (data[asset].values[index][dic_columns['long_usd_z']]>this.g_thresh) {
                        dic_count[asset]['down'] +=  1;
                    } 
                }
                //let a_index = data[a_exchange][a_category].values[data[a_exchange][a_category].values.length-1][column_price];
                //let a_ret = data[a_exchange][a_category].values[data[a_exchange][a_category].values.length-1][column_ret];                
            }

            for (let a_asset in dic_count) {
                for (let a_key in dic_count[a_asset]) { 
                    let a_ret = 0.01;
                    if (dic_count[a_asset][a_key]>0) {
                        a_ret = -0.01;
                    }
                    //console.log('name=','label_'+a_asset.toLowerCase()+'_'+a_key);

                    let a_label = {title:this.$t('name.'+a_asset+a_key), value:dic_count[a_asset][a_key], value_pct_change: a_ret};
                    this.$refs['label_'+a_asset.toLowerCase()+'_'+a_key].update(a_label);                
                }

            }
            logger.log.debug('updateWidget:',dic_count);            
        },

        updateExchangeWidget(data,exchange) {
            let dic_columns = CommonFunc.getColumnDic(data[exchange]['overall'].columns,[],[]);            
            let column_ret = dic_columns['index_ret'];
            let column_price = dic_columns['price_avg'];
            
            for (let index=0; index<Config.general.SECTORS.length;index++) {
                let a_sector = Config.general.SECTORS[index];
                //console.log('sector=',a_sector);
                let a_index = data[exchange][a_sector].values[data[exchange][a_sector].values.length-1][column_price];
                let a_ret = data[exchange][a_sector].values[data[exchange][a_sector].values.length-1][column_ret];

                let a_label = {title:this.$t('category.'+a_sector), value:a_index, value_pct_change: a_ret};
                this.$refs['label_'+a_sector].update(a_label);
            }
        },

        updateCwatchChart(data) {
            logger.log.debug("updateCwatchChart");
            this.$refs.cwatchChart.update(data);
        },

        updateOracleChart(data) {
            this.$refs.cwatchChart.updateOracle(data);
        },


        onLoad(progress) {
            logger.log.debug('onLoad - ',progress);
        },


        onClickTimeframe(offset,timeframe) {
            //let ioffset = CONST.timeframe[this.g_timeframe];
            logger.log.debug('onClickTimeframe.ioffset=',offset);

            this.loadCryptoWatchData(offset);
        },

    }

};
</script>

<style scoped>

.box_knob {
    font-size:25px; 
    /*margin-bottom:30px;*/
}

.knob_title {
    color: #111111;
    font-size: 18px;
    font-weight: bold;    
    margin-bottom:10px;
}

</style>
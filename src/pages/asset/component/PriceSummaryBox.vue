<template>

    <div>
        <q-skeleton v-if="!v_price_loaded" height="100px" square animation="pulse-x" />

        <div class="row" v-if="v_price_loaded">
            <div class="col-6">

                <CBigLabel ref='label_btc' 
                    title="" :moreButton="$t('button.chartview')"
                    :value="data.ticker.last" 
                    :valueRet="v_format(data.ticker.ret_24h)"
                    :updatedAt="data.ticker.updated_at"
                    :extraCaption="v_price_volume(data)"
                    extraClass="gUserNameSM"
                    @onClick="onClick"></CBigLabel>
                    
            </div>
            <div class="col-6 q-pl-lg">
                <div class="boxProfit q-mb-md ">
                    <div class="titleProfit">
                        <span :class="v_color(data.ticker.ret_7d,1)">{{v_format(data.ticker.ret_7d)}} %</span>
                        <q-badge class="q-ml-sm" align="top">1W</q-badge>
                        <q-linear-progress :color="v_color(data.ticker.ret_7d,0)" :value="v_format_roi(data.ticker.ret_7d)" />
                    </div>
                    
                </div>       
                <div class="boxProfit q-mb-md">
                    <div class="titleProfit">
                        <span :class="v_color(data.ticker.ret_1m,1)">{{v_format(data.ticker.ret_1m)}} %</span>
                        <q-badge class="q-ml-sm" align="top">1M</q-badge>
                        <!-- <span class="gCaption"></span> -->
                        <q-linear-progress :color="v_color(data.ticker.ret_1m,0)" :value="v_format_roi(data.ticker.ret_1m)" />
                    </div>                    
                </div>         
                <div class="boxProfit">
                    <div class="titleProfit">
                        <span :class="v_color(data.ticker.ret_3m,1)">{{v_format(data.ticker.ret_3m)}} %</span>
                        <q-badge class="q-ml-sm" align="top">3M</q-badge>
                        <!-- <span class="gCaption"></span> -->
                        <q-linear-progress :color="v_color(data.ticker.ret_3m,0)" :value="v_format_roi(data.ticker.ret_3m)" />
                    </div>                    
                </div>                

            </div>

        </div>

<!--                    
        <div class="q-mb-xl">
            <div class="q-pt-lg">                
                <div class="gSubTitle q-pb-xl">
                    <span class="gTextSubTitle">24H Change</span>
                </div>
                <q-slider                
                    v-model="data.ticker.change_percentage"
                    label label-always readonly dense
                    :min="-10"
                    :max="10"
                    :step="1"
                    :label-value="'ROI : ' + data.ticker.change_percentage + ' %'"                
                    :color="v_color(data.ticker.change_percentage)"
                />
            </div>
            <div class="q-pt-lg">
                <div class="gSubTitle q-pb-xl">
                    <span class="gTextSubTitle"> 
                        24H Price Range
                    </span>
                </div>
                <q-slider
                    v-model="data.ticker.last"
                    label label-always readonly dense
                    :min="data.ticker.low_24h"
                    :max="data.ticker.high_24h"
                    :step="1"                
                    :label-value="v_label(data)"
                    color="orange-9"
                />
                <div class="row">
                    <div>
                        <span class="gCaption">$ {{ v_format(data.ticker.low_24h) }}</span>
                    </div>
                    <q-space />
                    <div>
                        <span class="gCaption">$ {{ v_format(data.ticker.high_24h) }}</span>
                    </div>
                </div>
            </div>      
              
        </div>

        <div>
            <q-markup-table flat class="price_table">
                <tbody>
                <tr>
                    <td> 
                        <span class="price_label caption_color">{{ $t('name.price_prev') }}</span>  
                        <br><span class="price_tag value_color">{{ g_price['price_prev'] }}</span>
                    </td>
                    <td> 
                        <span class="price_label caption_color">{{ $t('name.price_high') }}</span>
                        <br><span class="price_tag value_color">{{ g_price['price_high'] }}</span>
                    </td>
                </tr>
                <tr>
                    <td> 
                        <span class="price_label caption_color">{{ $t('name.volume') }}</span>
                        <br><span class="price_tag value_color">{{ g_price['volume'] }}</span>
                    </td>
                    <td>
                        <span class="price_label caption_color">{{ $t('name.price_open') }}</span>
                        <br><span class="price_tag value_color">{{ g_price['price_open'] }}</span>
                    </td>
                </tr>
                <tr>
                    <td>
                        <span class="price_label caption_color">{{ $t('name.price_low') }}</span> 
                        <br><span class="price_tag value_color">{{ g_price['price_low'] }}</span>
                    </td>
                    <td>
                        <span class="price_label caption_color">{{ $t('name.tv') }}</span> 
                        <br><span class="price_tag value_color">{{ g_price['tv'] }}</span>
                    </td>
                </tr>
                </tbody>
            </q-markup-table>
        </div>
-->        
    </div>
        
</template>

<script>
import CommonFunc from 'src/util/CommonFunc';
import logger from "src/error/Logger";
import CBigLabel from 'components/CBigLabel';

import {AssetModel} from "src/models/AssetModel";

export default {
    name:'PriceSummaryBox',
	props: {
        data: {
            required: true,
            default: new AssetModel()
        },
    },
    components: {
        CBigLabel,
    },
	computed: {
        v_color() {
            return (value,ctype=0) => {                
                if (! value) return;
                //logger.log.debug("AssetView.PriceSummaryBox.v_color=",value);
                if (ctype==0) {
                    return CommonFunc.getPerfColor(value);
                }
                return "text-"+CommonFunc.getPerfColor(value);
            };            
        },
        v_change() {
            return (value) => {                
                if (value>10) { return 10 }
                if (value<-10) { return -10 }
                return value; 
            };            
        },
        v_format() {
            return (value) => {
                if(!value) {
                    return '';
                }
                if (value>0) {
                    return "+" + CommonFunc.formatNumber(value,2);    
                }
                return CommonFunc.formatNumber(value,2);
            };
        },
        v_format_roi() {
            return (value) => {
                if(!value) {
                    return 0;
                }
                return Math.abs(value/100);
            };
        },
        v_label() {
            return (data) => {
                const msg = 'Price : $ '+ this.v_format(data.ticker.last);
                return msg;
            }
        },
        v_price_volume() {
            return (data) => {
                if (! data.ticker.volume) return '';

                let msg = "Volume : $" + CommonFunc.milifyNumber(data.ticker.volume);
                return msg;
            }
        }
	},
    data() {
        return {
            g_price: {'price_prev':0, 'price_low':0, 'price_high':0, 'price_open':0, 
                'price':0, 'price_ret':0, 'volume':0, 'tv':0, 
                'updated_date':'', 'icon':'arrow_drop_up', class:'text-red'},    
            
            v_price_loaded: false,
        }
    },
    methods: {
        setLoading(value) {
            this.v_price_loaded = value;
        },
        update(json_data) {
            logger.log.debug("PriceSummaryBox.update : data=",json_data);

            const dic_columns = CommonFunc.getColumnDic(json_data['overall'].columns,[],[]);
            const a_price = json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['priceClose']];
            const a_price_prev = json_data['overall'].values[ json_data['overall'].values.length-2 ][dic_columns['priceClose']];

            this.g_price['price'] = CommonFunc.formatNumber(a_price,2);
            this.g_price['price_prev'] = CommonFunc.formatNumber(a_price_prev,2);
            this.g_price['price_low'] = CommonFunc.formatNumber(json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['priceLow']],2);
            this.g_price['price_high'] = CommonFunc.formatNumber(json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['priceHigh']],2);
            this.g_price['price_open'] = CommonFunc.formatNumber(json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['priceOpen']],2);
            this.g_price['volume'] = CommonFunc.milifyNumber(json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['volume']]);


            let a_ret = ((a_price-a_price_prev)/a_price)*100;
            
            let a_class = 'text-red';
            let a_icon = 'arrow_drop_down';
            if (a_ret>0) {
                a_class = 'text-green'
                a_icon = 'arrow_drop_up';
            }
            
            this.g_price.icon = a_icon;
            this.g_price.class = a_class;
            this.g_price['price_diff'] = CommonFunc.formatNumber(a_ret,2);
            this.g_price['price_ret'] = CommonFunc.formatNumber(a_ret,2);

            let a_tv = json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['volume']] * json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['priceClose']];
            this.g_price['tv'] = CommonFunc.milifyNumber(a_tv);
            this.g_price['updated_date'] = json_data['overall'].values[ json_data['overall'].values.length-1 ][dic_columns['trade_date']];
        },
        
        onClick: function() {
            logger.log.debug("PriceSummaryBox.onClick");
            this.$emit("onClick",{});
        }
    },
};

</script>


<style scoped>

.box_price {
    display: grid;
    grid-template-columns: minmax(90px, 90px) 1fr;
}

.price_box {
    text-align:center;    
}

.price_big {
    font-size:30px;
    font-weight: bold;
    color:#111111;
}    

.percent_below {
    font-size:13px;
    vertical-align:top;
}


.price_date {
    vertical-align:top;
    font-size:8px;
    color:#BBBBBB;
}
/*
.price_label {
    font:12px;
    color:#464646;
    font-weight: bold;
    padding-right:5px;
}
*/

.price_table td {
    text-align:left;
}

.score_table {
    text-align:center;
}

.box_score {
    display: grid;
    grid-template-columns: minmax(90px, 90px) 1fr;
}

.box_score_table {
    margin-top:0px;
}

.box_score_table .box_score_table_column {
    width:20px;
    padding-bottom:10px;
}

.box_score_table tr {
    height:60px;
    vertical-align: bottom;
}

.box_score_point {
    text-align:center;
    padding-top:13px;
}

.score_point {
    font-size:38px;
    font-weight:bolder; 
}

.score_label {
    font-size:18px;
    color:#000000;
}

.price_tag {
    line-height:40px;
    font-size:16px;
    color:#E71915;
}

.q-slider div {
    height:5px !important;
}

.boxProfit {

    padding:2px 0px 2px 0px;
}

.titleProfit {
    font-size:20px;
    font-weight: bold;
}

.titleProfitBox {
    font-size:20px;    
    font-weight: bolder;
    border-bottom:1px solid #e6e6e6;
    padding-top:5px;
    padding-bottom:5px;
}
</style>
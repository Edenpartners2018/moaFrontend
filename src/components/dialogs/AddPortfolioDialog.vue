<template>

    <div>
        <q-dialog 
            v-model="v_show" 
            class="full-width window-height"
            position="top"
            persistent
            transition-show="slide-down"
            transition-hide="slide-up"
        >
            <q-card>
                <q-card-section>
                    <div class="row">
                        <div class="closeButton">
                            <WDialogCloseButton @onClick="onClickClose" />&nbsp;
                        </div>

                        <div class="q-pl-sm">
                            <div>
                                <span class="text-h6">{{v_title}}</span>
                            </div>
                            <div>
                                <span class="gCaption">{{ $t('dialog.add_portfolio.desc') }}</span>
                            </div>
                        </div>
                        
                    </div>
                </q-card-section>       
                <q-separator />         
                <q-card-section>
                    <div class="row">
                        <div class="col">
                            <CryptoSelect ref="cryptoSelector" filled="1"
                                :label="$t('dialog.add_portfolio.asset.title')"                                 
                                @onSelect="onSelectAsset"  />

                            <WTextArea v-model="v_portfolio_item.description" ref="descText"
                                maxLength="300" showLength="1"
                                label="Description" rows="5" :hint="$t('dialog.add_portfolio.description.title')" 
                                customStyle="border:none;background:#f2f2f2;" />

                            <div>
                                <div class="q-pt-md q-pb-xs">
                                    Please select portfolio group
                                </div>

                                <div class="row" >
                                    <div class="col-11">
                                        <q-tabs inline-label mobile-arrows outside-arrows dense
                                            align="justify" 
                                            indicator-color="blue" active-color="blue" class="bg-grey-2"
                                            v-model="v_tab" :breakpoint="0"
                                            v-if="v_tabs.length>0">
                                            <q-tab v-for="tab in v_tabs" :key="tab.name" v-bind="tab" />
                                        </q-tabs>
                                    </div>
                                    <div class="col-1">
                                        <q-btn flat dense icon="add_circle_outline" label="" @click="onClickNewGroup" />
                                    </div>
                                </div>
                            </div>
<!--
                            <q-select
                                filled use-input fill-input hide-selected input-debounce="0"
                                class="q-pt-sm" behavior="menu"
                                v-model="v_input"
                                :label="$t('dialog.add_portfolio.group_name.title')" 
                                :options="v_group_list"
                                :error="v_error_group"
                                @input-value="onPortfolioChange"                                
                                error-message="Please select a group"
                                ref="selectPortfolio"
                            >
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            {{ $t('dialog.add_portfolio.no_results.title') }}
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
-->                            
                        </div>
                    </div>
                </q-card-section>       
                
                <q-card-actions >
                    <q-btn class="fit"  color="primary" ripple
                        :label="v_button_label" :loading="v_loading" @click="onClickSave" />
                </q-card-actions>        

            </q-card>

        </q-dialog>

        <EditDialog ref="dialogEdit" :title="$t('dialog.edit_dialog.portfolio.title')" @onSave="onSaveEdit" />
    </div>

</template>


<script>
import { store } from 'src/store/store';
import { Config } from 'src/data/Config';
import CommonFunc from 'src/util/CommonFunc';
import logger from 'src/error/Logger';

import WTextArea from "src/components/WTextArea";
import WDialogCloseButton from "src/components/WDialogCloseButton";
import CryptoSelect from "src/components/CryptoSelect";
import EditDialog from "src/components/dialogs/EditDialog";

//import UserModel from "src/models/UserModel";
//import { PriceModel, PriceListModel } from "src/models/PriceModel";
import { PortfolioListModel, PortfolioItemModel } from "src/models/PortfolioModel";


export default {
    name: 'AddPortfolioDialog',
    components: {
        WTextArea,
        CryptoSelect,
        EditDialog,
        WDialogCloseButton
    },
	props: {
        title: {
            type:String,
            default: 'Add Portfolio Item',
        },
    },
    computed: {
        v_me() {
            return store.getters.me;
        },
        v_title() {
            if (this.v_portfolio_item.id) {
                return this.$t("dialog.update_portfolio.title");
            }
            return this.$t("dialog.add_portfolio.title");
        },
        v_button_label() {
            if (! this.v_is_new) {
                return this.$t("button.update");
            }
            return this.$t("button.add");
        },
        v_is_new() {
            if (this.v_portfolio_item.id) return false;
            return true;
        }
    },
    data() {
        return {
            g_data: '',
            
            v_user: null,
            v_show: false,
            
            //v_portfolio: new PortfolioItemModel(),
            v_portfolio_item: new PortfolioItemModel(),
            
            v_loading: false,
            //v_title: this.title,
            v_tab: 'Default',
            v_tabs: [],

            v_selected_asset: null,
            v_selected_portfolio: null,

            v_groups: null,
            v_group_list: [],
            
            v_input: null,
            v_options: this.v_group_list,
            v_updated_count: 0,

            v_error: {
                title: {error:false, msg:''},
                text: {error:false, msg:''},
            },      
            v_error_group: false,              
        }
    },

    created() {
        logger.log.debug("AddPortfolioDialog.created");
    },
    beforeMount() {
        logger.log.debug("AddPortfolioDialog.beforeMounted - params=",this.$route.params);        
    },
    mounted() {
        logger.log.debug("AddPortfolioDialog.mounted");
    },
    updated() {        
        if (this.v_updated_count==0) {
            logger.log.debug("AddPortfolioDialog.updated : v_portfolio_item=",this.v_portfolio_item);

            if ( (this.v_portfolio_item) && (this.v_portfolio_item.id)) {
                this.fillValue();
            }
        }
        
        this.v_updated_count += 1;
    },
    
    methods: {   
        clear() {
            this.v_portfolio_item.asset_id = -1;
            this.v_portfolio_item.portfolio_id = -1;
            this.v_portfolio_item.portfolio_name = '';
            this.v_portfolio_item.price = 0;
            this.v_portfolio_item.qty = 0;
            this.v_portfolio_item.description = '';
            
            //this.v_input = '';
            if (this.$refs.descText) {
                this.$refs.descText.clear();
            }            
            if (this.$refs.cryptoSelector) {
                this.$refs.cryptoSelector.setValue('');
                this.$refs.cryptoSelector.setError(false);
            }
            this.v_loading = false;
        },

        reset() {
            this.v_portfolio_item = new PortfolioItemModel();
        },
        fillValue() {
            logger.log.debug("AddPortfolioDialog.fillValue");
            this.v_input = this.v_portfolio_item.portfolio_name;
            if (this.$refs.cryptoSelector) {
                this.$refs.cryptoSelector.setValue(this.v_portfolio_item.api_asset.symbol);            
            }
        },
        setPortfolioItem(v_portfolio) {
            this.v_portfolio_item = v_portfolio;
        },

        setPortfolioSelector(v_portfolio,v_item) {
            logger.log.debug("AddPortfolioDialog.setPortfolioSelector: v_portfolio=",v_portfolio);

            let groups = [];
            
            if (v_portfolio.items.length==0) {
                groups.push( {name: Config.setting.defaultPortfolio, icon:'', label:Config.setting.defaultPortfolio} );
            } else {
                for (let index=0;index<v_portfolio.items.length;index++) {
                    groups.push( {name:v_portfolio.items[index].name, icon:'', label:v_portfolio.items[index].name} );
                }
            }
            
            this.v_tabs = groups;

            if (groups.length>0) {
                if (this.v_is_new) {
                    this.v_tab = groups[0].name;
                } else {
                    const a_group = v_portfolio.getItem(v_item.portfolio_id);
                    this.v_tab = a_group.name;
                }                                
            }
            logger.log.debug("setPortfolioSelector",groups,this.v_tab);
            
        },

        validate(portfolio_item) {
            
            if (CommonFunc.isEmptyObject(portfolio_item.asset_id) || (portfolio_item.asset_id==-1) ) {
                this.$refs.cryptoSelector.setError(true);
                return false;
            }

            return true;
        },


        show(v_user,v_portfolio_item) {
            logger.log.debug("AddPortfolioDialog.show : v_portfolio=",v_portfolio_item);
            
            this.v_user = v_user;

            if (v_portfolio_item) {
                this.setPortfolioItem(v_portfolio_item);
            } else {
                this.clear();
            }

            this.setPortfolioSelector(this.v_user.portfolio,v_portfolio_item);

            logger.log.debug("AddPortfolioDialog.show : v_portfolio=",this.v_portfolio_item);

            this.v_updated_count = 0;
            this.v_loading = false;
            this.v_show = true;
        },

        hide() {
            this.v_show = false;
        },


        filterGroup: function(val, update) {
            if (val === '') {
                update(() => {
                    this.v_options = this.v_group_list
                })
                return
            }

            update(() => {
                const needle = val.toLowerCase()
                this.v_options = this.v_group_list.filter(v => v.toLowerCase().indexOf(needle) > -1)
            })            
        },
        processSave() {
            const _this = this;
            this.v_loading = true;
            this.v_portfolio_item.addToServer().then( response => {
                _this.v_loading = false;                
                if (response.data.ret!=0) {                    
                    CommonFunc.showErrorMessage(_this,response.data.msg);
                    return;
                }
                
                logger.log.debug("AddPortfolioDialog.processSave : response=",response);

                CommonFunc.showOkMessage(_this,'Portfolio added');
                
                _this.v_user.portfolio.addPortfolioItem(response.data.portfolio_item);
                _this.v_user.portfolio.calcPerformance(store.state.prices);                
                
                _this.$emit("onPortfolioItemAdded",response.data.portfolio_item);
                
                _this.clear();
                //_this.hide();

            }).catch( err=> {
                _this.v_loading = false;
                CommonFunc.showErrorMessage(_this,'Portfolio error');
            });

        },
        processUpdate() {
            logger.log.debug("AddPortfoliodialog.processUpate");

            const _this = this;
            this.v_loading = true;
            this.v_portfolio_item.updateToServer().then( response => {
                _this.v_loading = false;

                if (response.data.ret!=0) {
                    CommonFunc.showErrorMessage(_this,response.data.msg);
                    return;
                } 
                CommonFunc.showOkMessage(_this,'Portfolio updated');
                
                //_this.v_user.portfolio.addPortfolioItem(response.data.portfolio_item);
                _this.v_user.portfolio.calcPerformance(store.state.prices);
                _this.$emit("onPortfolioItemUpdated",response.data.portfolio_item);
                _this.reset();
                _this.clear();                
                //_this.hide();

            }).catch( err=> {
                _this.v_loading = false;
                CommonFunc.showErrorMessage(_this,'Portfolio error');
            });

        },
        setPrice() {
            let a_price = store.state.prices.getPrice(this.v_selected_asset.symbol);
            if (a_price) {
                this.v_portfolio_item.price = a_price.last;
            } else {
                this.$refs.cryptoSelector.setError(true,'The price of selected asset is not provided');
            }

            logger.log.debug('AddPortfolioDialog.setPrice param - ',this.v_selected_asset.symbol,a_price);            
            return;
        },
        processPriceFetch() {
            
            if (store.state.prices.items.length>0) {
                this.setPrice();
                return;
            } 

            const _this=this;
            store.state.prices.load().then( response => {
                _this.setPrice();
            })            
        },

        onSelectAsset(asset) {            
            this.v_selected_asset = asset;
            this.v_portfolio_item.asset_id = asset.id;
            
            this.processPriceFetch();
        },

        onClickSave() {                        
            logger.log.debug('AddPortfolioDialog.onClickSave - ',this.v_portfolio_item);
            this.v_portfolio_item.description = this.$refs.descText.getValue().slice();

            if (! this.validate(this.v_portfolio_item)) {                
                return;
            }

            logger.log.debug('AddPortfolioDialog.onClickSave - 1');

            if (this.v_is_new) {
                this.processSave();
            } else {
                logger.log.debug('AddPortfolioDialog.onClickSave - 3');
                this.processUpdate();
            }            
            
        },

        onClickClose() {
            logger.log.debug('onClickClose - ');
            this.hide();
        },

        onPortfolioChange(value) {      
            logger.log.debug('AddPortfolioDialog.onPortfolioChange=',value, this.v_input);
                        
            this.v_input = value;
            if (value.length>2) {
                this.v_error_group = false;                
                this.v_portfolio_item.portfolio_name = value;
            }            
        },

        onNewPortfolio(val,done) {
            logger.log.debug('onClickClose - ',val);
            done(val,'add-unique');
        },

        onSaveEdit(dicParam) {
            logger.log.debug("AddPortfolioDialog.onSaveEdit : ",dicParam);
            
            this.v_tabs.push( {name:dicParam.value,icon:'',label:dicParam.value});
            this.v_tab = dicParam.value;
            this.v_portfolio_item.portfolio_id = -1;
            this.v_portfolio_item.portfolio_name = dicParam.value;
        },

        onClickNewGroup() {
            this.$refs.dialogEdit.setMaxlength(20);
            this.$refs.dialogEdit.show('portfolio','text','');
        }

    }

};
</script>


<style scoped>
.closeButton {
    margin:-10px 10px 0px -10px;
}
</style>
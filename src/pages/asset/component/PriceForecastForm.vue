<template>
	<div :style="v_style" v-show="visible" @click="onClick">
		<div>
			<div class="row q-mb-md boxPrice" v-if="v_me.loggedIn" @click="onClickExpand">
				<div class="q-pr-md">
					<WAvatar :avatar="v_me.avatar_thumb" :username="v_me.username" :displayname="v_me.dispaly_name" />
				</div>
				<div class="gUserNameSM q-pt-md boxPriceInput"> 
					<q-input class="gCaption" outlined readonly dense :placeholder="v_label" />
				</div>
			</div>

			<div class="boxPriceForm q-mb-sm" v-if="v_expand">
				<div class="row q-pa-md justify-center text-center">
					<div class="q-pr-md">
						<q-btn 
							class="gRatingBtnMD" flat ripple
							:class="v_color_like"                
							style="font-size: 2.4em;"
							icon="arrow_circle_up" 
							@click="onClickRate(1)" />
						<div class="gRatingCountMD">
							<span>{{v_likeCaption}}</span>
						</div>
					</div>
					<div class="q-pl-md">
						<q-btn
							class="gRatingBtnMD" flat ripple
							:class="v_color_dislike"
							style="font-size: 2.4em;"
							icon="arrow_circle_down"
							@click="onClickRate(-1)" />
						<div class="gRatingCountMD">
							<span>{{v_dislikeCaption}}</span>
						</div>
					</div>        
				</div>


				<div class="q-px-md">
					<WTextArea
						ref="descText"				
						hint="why do you think like that?"
						v-model="v_review.content"
						:rows="v_rows"
						@onFocus="onFocus"
						@onFocusOut="onFocusOut"
					/>
				</div>

				<div class="row">
					
					<q-space />

					<div class="q-mx-md q-mb-sm" align="right" v-if="v_me.loggedIn">
						<q-btn
							class="gButtonMD" label="save" ripple
							:loading="v_loading"
							@click.stop="onClickSubmit"
							v-if="showSaveButton"
						>
						</q-btn>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>


<script>
import { CONST } from 'src/data/const';
import {store} from "src/store/store";
import NavFunc from 'src/util/NavFunc';
import CommonFunc from "src/util/CommonFunc";
import logger from "src/error/Logger";
import WTextArea from "src/components/WTextArea";
import WAvatar from "src/components/w/WAvatar";

import {AssetReviewPageModel} from "src/models/PageModel";


export default {
	name: "review-form",
	components: {
		WAvatar,
		WTextArea,
	},
	//mixins: [hasComments],
	props: {
        category: {
            required: false,
            type:String,
            default: ''
        },
        assetId: {
            required: false,
            type: Number,
            default:-1
        },
		showSaveButton: {
			type: Boolean,
			default: true,
		},
		type: {
			validator(value) {
				return ["comment", "reply"].includes(value);
			},
			default: "comment",
		},
		visible: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
        v_me() {
            return store.getters.me;
        },
		v_label() {
			return this.v_me.display_name + "앞으로 가격이 오를까요?";
		}
	},
	data() {
		return {
            v_review: new AssetReviewPageModel(),

			v_comments: "",
			v_style: "",
			v_loading: false,
			v_expand: false,

			v_likeCaption:'Up',
			v_dislikeCaption: 'Down',

            v_color_like:'',
            v_color_dislike:'',

			v_rows: "5",						
			v_rating: 5,
			v_error: {
				error: false,
				msg: "",
			},

		};
	},
	watch: {},

	mounted() {
		logger.log.debug("AssetReviewForm.mounted");
		this.prepare();
	},

	methods: {
		prepare() {
			//logger.log.debug("Comment-Form.prepare : v_me=",this.v_me);
			if (! this.$refs.descText) {
				return;
			}

			this.$refs.descText.setStyle("border:none;");
			if (this.v_me.loggedIn) {
				this.$refs.descText.setHint("Please type your review");
				this.$refs.descText.setEnabled(true);
			} else {
				this.$refs.descText.setHint("Please log-in to write comments");
				this.$refs.descText.setEnabled(false);
			}
		},

		show() {
			// this.visible = true
			this.v_style="display:block";
		},
		hide() {
			this.v_style="display:none";
		},
		minimize() {
			this.v_expand = false;
		},		
        clear() {
            this.v_review.content = "";
            this.v_review.average_rating = 0;
			this.$refs.descText.setStyle("border:none;");
            this.$refs.descText.setValue(this.v_comments);

			this.v_color_like="";
			this.v_color_dislike="";

			this.minimize();
			//this.$refs.descText.setRows(1);
        },

		setReview(review) {
			console.log("AssetReviewForm.setReview=", review);
			
            this.v_review = review;
            this.v_comments = this.v_review.content;
            this.v_rating = this.v_review.average_rating;
            this.$refs.descText.setValue(this.v_comments);
		},

		activate() {
			// await this.$nextTick()
			this.$refs.descText.setStyle("border:none;background-color:#f2f2f2;");
			if (this.$refs.contentInput) {
				this.$refs.contentInput.focus();
			} else if (this.$el.querySelector("#contentInput")) {
				this.$el.querySelector("#contentInput").focus();
			}
		},

		validate() {
			console.log("AssetReviewForm.validate");

			if (CommonFunc.isEmptyObject(this.v_review.average_rating)) {
				
				const a_dialog = store.getters.components.getComponent('alertDialog');
				a_dialog.show('Error','Please select your price');

				return false;
			}
            return true;
		},

        save() {
            const _this = this;
            
			//let tags = [this.category,CONST.REVIEW_CATEGORY + this.category];
			let dic_param = {
				asset_id: this.assetId,
                review: this.v_review.content,
				rating: this.v_review.average_rating,
				category: this.category
			};
            
            let a_review = this.v_review;
            if (! this.v_review) {
                a_review = new AssetReviewPageModel();
            }
            
            dic_param.id = a_review.id;
            logger.log.debug('AssetView.onClickReviewSave - ',dic_param);       

			this.v_loading = true;
            a_review.save(dic_param).then( response => {
                logger.log.debug('AssetView.onClickReviewSave - response = ',response);
                //_this.$refs.reviewList.addReview(response.data);
                _this.clear();
				_this.v_loading = false;
				dic_param.response = response;                
				CommonFunc.showOkMessage(_this,'review posted');
                _this.$emit("onClickReviewSave", dic_param);
            }).catch( err => {
				_this.v_loading = false;
                CommonFunc.showErrorMessage(_this,'review posting error');
            });
        },



		/**
		 * Save the new comment and reset the form states
		 */
		onClickSubmit() {

            this.v_review.content = this.$refs.descText.getValue();
			if (! this.validate()) {
                //this.$refs.descText.setErrorMessage('Please type your review');
				return;
            }
			this.$refs.descText.setErrorMessage(null);
            this.save();
		},

		onFocus(event) {
			logger.log.debug("onFocus=", this.$parent);
			if (! this.v_me.isLoggedIn()) {
				return;
			}
			this.$refs.descText.setStyle("border:1px solid #e0e0e0;background-color:#f2f2f2;");
			this.$refs.descText.setRows(7);
			this.$emit("onEditorFocus", event);
		},

		onFocusOut(event) {
			logger.log.debug("onFocusOut=", this.$parent);			
			this.$emit("onEditorFocusOut", event);
		},

		onClickExpand() {
			logger.log.debug("AssetReviewForm.onClickExpand : parent=",this.$parent);
			this.v_expand = ! this.v_expand;
		},

		onClick() {
			logger.log.debug("AssetReviewForm.onClick : parent=",this.$parent);

			if (this.v_me.isLoggedIn()) {
				return;
			}

			const _this=this;
            store.getters.components.getComponent('confirmDialog').show('Please login first',function(value) {
                logger.log.debug("AssetQAView.onClickAnswer - confirm=",value,_this.$route);
                if (value) {
					store.getters.nav.add(this.$route);					
                    NavFunc.navSignin(_this);
                }
            });

		},

		onClickRate(value) {
			this.v_review.average_rating = value;
			if (value==1) {
				this.v_color_like="text-red";
				this.v_color_dislike="";
			} else {
				this.v_color_like="";
				this.v_color_dislike="text-blue";
			}
		},
	},
};
</script>


<style scoped>
.boxPriceForm {
	border: 1px solid #cccccc;
	border-radius: 8px;
}

.boxEditorTextarea {
	height: 150px !important;
}

.inline-items-wrapper {
	display: flex;
	> div {
		width: 50%;
	}
	.email-item {
		margin-right: 10px;
	}
}

/* override quasar css */
.boxMessageTextarea {
	height: 150px !important;
	max-height: 200px;
}

.boxPrice {    
    display:flex;
}

.boxPriceInput {    
    flex-grow:1;    
}

</style>
<template>
	<div>

		<CTitle ttype='subtitle' :title="v_title" desc=""
			:loadMoreCaption="v_more_caption" @onClickTitleMore="onClickMoreBlog"></CTitle>

		<q-skeleton v-if="!v_list_loaded" height="150px" square animation="pulse-x" />
		<div v-show="v_list_loaded">
			<div>
				<q-list separator class="rounded-borders">
					<q-item 
						class="q-pa-sm"
						clickable
						:key="index"
						v-for="(a_tweet, index) in v_tweets.items"
						v-if="index<v_maxLength"
					>
						<q-item-section class="blogAvatar" avatar top>
							<WAvatar :avatar="a_tweet.owner.avatar_thumb" :username="a_tweet.owner.username" />
						</q-item-section>
						<q-item-section top>
							<q-item-label class="no-margin" lines="1" @click.stop="onClickTweet(a_tweet.id)" v-ripple>
								<div class="gUserNameSM">
									{{ a_tweet.owner.display_name ? a_tweet.owner.display_name : a_tweet.owner.username }}
								</div>
								<WSubinfo 
									:pub_date="a_tweet.created_at" 
									like_count="-1" 
									dislike_count="-1" />

								
								<div class="gBodyLG" v-html="a_tweet.body"></div>
								
							</q-item-label>
							<q-item-label>
								<WRatingSmallButton ref="ratingButton" 
									:data="a_tweet" :likeCount="a_tweet.like_count" :dislikeCount="a_tweet.dislike_count" 
									:commentCount="a_tweet.comment_count"
									@onClickRating="onClickRating" />
							</q-item-label>

						</q-item-section>

					</q-item>
					<q-separator class="q-mb-md" size="1px" />

				</q-list>

				<LoadMore ref="loadMore" @onClickLoadMore="onClickLoadMore" />
			</div>

			<div v-if="(! v_tweets) || (v_tweets.items.length==0)" class="q-pb-lg">
				<div class="gNoListTitle"> {{ $t('name.no_tweet') }} </div>
				<div class="gNoListMessage"> {{ $t('name.no_tweet_desc') }} </div>
			</div>

		</div>
	</div>
</template>

<script>
import { store } from 'src/store/store';
import { Config } from 'src/data/Config';
import NavFunc from 'src/util/NavFunc';
import CommonFunc from "src/util/CommonFunc";
import logger from "src/error/Logger";

import { TweetListModel } from "src/models/TweetModel";

import CTitle from 'components/CTitle';
import WAvatar from "src/components/w/WAvatar";
import WSubinfo from 'components/WSubinfo';
import LoadMore from "src/components/LoadMore";
import WRatingSmallButton from 'components/WRatingSmallButton';



export default {
	components: {
		CTitle,
		WAvatar,
		WSubinfo,
		LoadMore,
        WRatingSmallButton
	},
    props: {
        maxLength: {
            default: 20,
        },
		title: {
			type:String,
			default: "Blog List"
		},
		moreCaption: {
			type:String,
			default: ""
		},
		category: {
			required:true,
			default: ""
		},
		symbol: {
			required:true,
			default: ""
		},
		assetId: {
			required:true,
			default:-1
		},
		tab: {
			default:''
		}
    },
    computed: {
        v_shorten() {
            return (value) => {
                return CommonFunc.shortenString(value,Config.setting.maxTitleLength);
            };
        }
    },

	data() {
		return {
			v_list_loaded: false,
			g_data: null,
			
			v_title: this.title,
			v_maxLength: this.maxLength,
			v_more_caption: this.moreCaption,								
		
			v_query: {
				user_id: null,
				category: null,
				content_type: null,
			},

			v_tweets: new TweetListModel(),
		};
	},

	methods: {
		loadTweet(param) {
			const _this = this;

			this.v_tweets.load(param).then((response) => {
				_this.g_data = response.data;
				_this.$refs.loadMore.setPageParameter(response.data);
				_this.v_list_loaded = true;
				logger.log.debug("TweetList.loadTweet - response",_this.g_data);
			})
			.catch((err) => {
				_this.v_list_loaded = true;
			});
		},


		update() {
			this.v_query.user_id = null;
			this.v_query.category = null;
			this.v_query.content_type= null;			
			this.loadBlogData(this.v_query);
		},

		updateByAsset(asset_id) {
			let dic_param = {
				asset_id: asset_id,
			};
			this.loadTweet(dic_param);
		},

		updateByCategory(category) {
			let dic_param = {
				user_id: null,
				category: category,
				content_type: null,
			};
			this.loadBlogData(dic_param);
		},

		updateByUser(user_id) {
			let dic_param = {
				user_id: user_id,
				category: null,
				content_type: null,
			};
			this.loadBlogData(dic_param);
		},

		addBlog(response) {
			logger.log.debug("BlogList.addBlog : response = ", response);
			this.v_posts.addFirst(response.data);
		},

		deleteBlog(post_id) {
			logger.log.debug("BlogList.deleteBlog : post_id = ", post_id);
			this.v_posts.delete(post_id);
			//this.v_posts.items = this.v_posts.delete(post_id);
		},

		onClickTweet(id) {
			logger.log.debug("onClickTweet : id = ", id);			
			NavFunc.navTweetDetail(this,id);
			//this.$emit("onClickBlog",{page_id:page_id});
		},

		onClickLoadMore() {
			logger.log.debug("BlogList.onClickLoadMore : next_url = ", this.v_next_url);
			
			this.v_maxLength = 999999;
			this.v_query.limit = this.$refs.loadMore.v_next.limit;
			this.v_query.offset = this.$refs.loadMore.v_next.offset;
			this.loadBlogData(this.v_query);
		},

		onClickMoreBlog() {
			logger.log.debug("BlogList.onClickMoreBlog : 1");			
            NavFunc.navBlog(this,this.category,this.symbol,this.objectId);
		},

        onClickRating(dicParam) {
            logger.log.debug('AssetReviewList.onClickRating : dicParam = ',dicParam);
            
            let tweet = dicParam.data;
            tweet.value = -1;
            if (dicParam.value=="like") {
                tweet.value = 1;
            }

            let dic_param = { id:tweet.id, value:tweet.value, method: 'vote' };
            const _this = this;
            tweet.vote(dic_param).then(response => {
                logger.log.debug('onClickReviewRating - ',response);
                dicParam._this.setColor(dicParam.value);
                //CommonFunc.showOkMessage(_this,"Review voted");
            }).catch( err => {
                CommonFunc.showErrorMessage(_this,"Tweet voting error");
            });

            //this.$emit("onClickRating",review);
        },        

	},
};
</script>


<style lang="sass">
</style>
<style scope>
.blogAvatar {
	margin-top:-4px;
}

</style>
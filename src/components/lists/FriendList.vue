<template>
	<div>

		<CTitle ttype='subtitle' :title="v_title" desc=""
			:loadMoreCaption="v_more_caption" @onClickTitleMore="onClickMoreFriend"></CTitle>

		<q-skeleton v-if="!v_list_loaded" height="150px" square animation="pulse-x" />                    

		<div v-show="v_list_loaded">
			<div v-show="v_items">
				<q-list separator class="rounded-borders">
					<q-item 
						class="q-pa-sm"
						clickable
						:key="index"
						v-if="index<v_maxLength && v_items"
						v-for="(a_user, index) in v_items"				
					>
						<q-item-section class="avatar" avatar top>
							<WAvatar :avatar="a_user.avatar" :username="a_user.username" />
						</q-item-section>
						<q-item-section top @click.stop="onClickUser(a_user.username)">
							<q-item-label lines="1">
								<span class="gUserNameSM">{{ a_user.username }}</span>
							</q-item-label>
							<q-item-label lines="1">

								<WSubinfo 
									username="" 
									:pub_date="a_user.created_at" 
									:like_count="-1" 
									:dislike_count="-1" />

							</q-item-label>
						</q-item-section>
						
						<q-item-section side>
							<q-item-label lines="1">
								<q-btn ripple :outline="v_follow_color_mine(a_user)" color="primary"
									:label="v_label_follow_mine(a_user)" :ref="'btnFollow_'+index"
									@click="onClickFollow(a_user,index)" v-if="v_is_owner" />

								<q-btn ripple :outline="v_follow_color_user(a_user)" color="primary"
									:label="v_label_follow_user(a_user)" :ref="'btnFollow_'+index"
									@click="onClickFollow(a_user,index)" v-if="! v_is_owner" />

							</q-item-label>
						</q-item-section>

					</q-item>
					<q-separator class="q-mb-md" size="1px" />

				</q-list>

				<LoadMore ref="loadMore" @onClickLoadMore="onClickLoadMore" />
			</div>

			<div v-show="(! v_items) || (v_items.length==0)" class="text-center">
				<div class="gListTitle"> 
					{{v_error_title}}
				</div>
				<div class="gCaption">
					{{v_error_msg}}
				</div>
			</div>
		</div>

	</div>

</template>


<script>
import { store } from 'src/store/store';
import { Config } from 'src/data/Config';
import NvaFunc from 'src/util/NavFunc';
import CommonFunc from "src/util/CommonFunc";
import logger from "src/error/Logger";

import CTitle from 'components/CTitle';
import WAvatar from "src/components/w/WAvatar";
import WSubinfo from 'components/WSubinfo';
import LoadMore from "src/components/LoadMore";
import UserModel from "src/models/UserModel";

export default {
	components: {
		CTitle,
		WAvatar,
		WSubinfo,
		LoadMore
	},
    props: {
		items: {
			default: null
		},
        maxLength: {
            default: 20,
        },
        limit: {
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
		mode: {
			type:String,
			default: "follower"
		},
		user: {
			required: true,
			default: null
		}
    },
    computed: {
		v_me() {			
			return store.getters.me;
		},
        v_shorten() {
            return (value) => {
                return CommonFunc.shortenString(value,Config.setting.maxTitleLength);
            };
        },
		v_is_owner() {
			if (this.v_me.id==this.v_user.id) {
				return true;
			}
			return false;
		},
		v_label_follow_mine: {
			get() {
				return (user) => {
					if (user.is_follower) {
						return this.$t("button.follow");
					}
					return this.$t("button.unfollow");					
				}
			},
		},
		v_follow_color_mine: {
			get() {
				return (user) => {
					if (this.v_is_owner) {
						if (user.is_follower) {
							return true;
						}
						return false;
					}
					return true;
				}
			},
			set(value) {
				return value;
			}
		},
		v_label_follow_user: {
			get() {
				return (user) => {
					if (user.is_following) {
						return this.$t("button.userfollowing");
					}
					return this.$t("button.userfollow");					
				}
			},
		},
		v_follow_color_user: {
			get() {
				return (user) => {
					if (user.is_following) {
						return false;
					}
					return true;
				}
			},
		},
		v_error_title (){
			if (this.mode=="follower") {
				return "No Follower";
			}
			return "No Following";
		},
		v_error_msg (){
			if (this.mode=="follower") {
				return this.$t('name.no_follower');
				//return "다른 사람이 팔로우하면 여기에 표시됩니다.";
			}
			//return "내가 팔로잉한 사람이 여기에 표시됩니다.";
			return this.$t('name.no_following');
		},
    },

	data() {
		return {
			v_list_loaded: false,
			g_data: null,
			
			v_title: this.title,
			v_maxLength: this.maxLength,
			v_more_caption: this.moreCaption,								
		
            v_pagination: {
                offset: 0,
                limit: this.limit,
            },

			v_user: null,
			v_items: null,

			//v_label_follow:'Follow',

			v_label_add_friend:'Follow',
			v_loading_add_friend:false,

			v_follow_loading:false,		
		};
	},

	methods: {
		update: function (user,offset=0) {
			this.setUser(user);
            this.v_pagination.offset = offset;
            this.loadRelation();
		},

		updateFollower: function (user,offset=0) {
			this.setUser(user);
            this.v_pagination.offset = offset;
            this.loadFollower();
		},

		updateFollowing: function (user,offset=0) {
			this.setUser(user);
            this.v_pagination.offset = offset;
            this.loadFollowing();
		},

		setUser(user) {
            logger.log.debug("setUser",user);
            this.v_user = user;
        },

        loadFollower() {
            const _this=this;
            this.v_user.loadFollower(this.v_pagination.offset,this.v_pagination.limit).then( response => {
                logger.log.debug("ProfileView.loadFollower - response=",response, _this.v_user.follower );                
                if (! _this.v_is_owner) { _this.v_user.follower.setFollowers(false) };
				_this.v_items = _this.v_user.follower.items;				
				_this.$refs.loadMore.setPagination(response.data.results,_this.v_pagination.offset,_this.v_pagination.limit);
				_this.v_list_loaded = true;
            }).catch(err=>{
				logger.log.error("ProfileView.loadFollower - err=",err);
            });

        },

        loadFollowing() {
            const _this=this;
            this.v_user.loadFollowing(this.v_pagination.offset,this.v_pagination.limit).then( response => {
                logger.log.debug("ProfileView.loadFollowing - response=",response, _this.v_user.following );
                if (! _this.v_is_owner) { _this.v_user.following.setFollowings(false) };
				_this.v_items = _this.v_user.following.items;
				_this.$refs.loadMore.setPagination(response.data.results,_this.v_pagination.offset,_this.v_pagination.limit);
				_this.v_list_loaded = true;
            }).catch(err=>{
				logger.log.error("ProfileView.loadFollowing - err=",err);
            });

        },

		onClickUser(username) {
			logger.log.debug("onClickUser : username = ", username);			
			NavFunc.navProfile(this,username);
			//this.$emit("onClickBlog",{page_id:page_id});
		},

		onClickLoadMore() {
			logger.log.debug("onClickLoadMore : next_url = ", this.v_next_url);

			this.v_pagination.offset += this.v_pagination.limit;
			this.loadRelation();
		},

		onClickMoreFriend() {
			logger.log.debug("FriendList.onClickMoreFriend : 1");
			
			//store.getters.nav.add(this.$route);
            //NavFunc.navProfile(this,this.v_user.username);
		},

		onClickFollow(user,index) {			
            const _this=this;
            
			let value = 1;
			if (this.v_is_owner) {
				if (! user.is_follower) {
					value = -1;
				}
			} else {
				if (user.is_following) {
					value = -1;
				}
			}

			logger.log.debug("FriendList.onClickFollow : value,user=",value,user);

			let a_btn = this.$refs['btnFollow_'+index][0];
            CommonFunc.checkButtonPermission(this,1,0).then(ret=>{
                //logger.log.debug("ProfileView.onClickFollow : ret=",ret);
                if (ret==0) return;
                
                //_this.v_follow_loading = true;
                _this.v_me.follow(user.id,value).then( response => {
                    logger.log.debug("onClickFollow - response=",response);
                    
					if (value==1) {
						user.is_follower = false;
						if (! _this.v_is_owner) { user.is_following = true; }
					} else {
						user.is_follower = true;
						if (! _this.v_is_owner) { user.is_following = false; }
					}
					
					a_btn.$forceUpdate(); 
					//a_btn.label = _this.v_label_follow(user);
                    //_this.v_follow_loading = false;

                }).catch(err=>{
                    CommonFunc.showErrorMessage(_this,err.msg);
                    _this.v_follow_loading = false;
                });
            });

		},

	},
};
</script>


<style scope>
.avatar {
	margin-top:-4px;
}
.news-title {
	font-size: 18px;
	color: #000000;
}

.news-date {
	font-size: 10px;
	color: #888888;
}


</style>
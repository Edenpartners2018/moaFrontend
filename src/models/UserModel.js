import {store} from 'src/store/store';
import {MoaConfig} from 'src/data/MoaConfig';
import AuthService from 'src/services/authService';
import CommonFunc from 'src/util/CommonFunc';
import Hasher from 'src/util/Hasher';
import logger from "src/error/Logger";

import LocalStorageService from 'src/services/localStorage';

import { PortfolioListModel, PortfolioModel, PortfolioItemModel} from "src/models/PortfolioModel";


export default class User {
    id = null; 
    username = null;
    email = null;
    password=null;
    token = null;
    loggedIn = false;
    staySignedIn = false;
    
    avatar = null;
    avatar_thumb = null;
    first_name = null;
    last_name = null;
    biography=null;

    coin=null;
    dislike_count=null;
    like_count=null;
    comment_count=null;
    question_count=null;
    answer_count=null;
    post_count=null;

    portfolio=new PortfolioListModel();


    constructor() {

    }


    assign(obj) {
        this.id = obj.id;
        this.username = obj.username;
        this.email = obj.email;
        this.avatar = obj.avatar;
        this.avatar_thumb = obj.avatar_thumb;
        this.password = CommonFunc.safeGetKeyValue(obj,'password');
        this.token = CommonFunc.safeGetKeyValue(obj,'token');
        this.loggedIn = CommonFunc.safeGetKeyValue(obj,'loggedIn');
        this.staySignedIn = CommonFunc.safeGetKeyValue(obj,'staySignedIn');

        this.first_name = CommonFunc.safeGetKeyValue(obj,'first_name');
        this.last_name = CommonFunc.safeGetKeyValue(obj,'last_name');
        this.title = CommonFunc.safeGetKeyValue(obj,'title');
        this.biography = CommonFunc.safeGetKeyValue(obj,'biography');
        this.avatar = CommonFunc.safeGetKeyValue(obj,'avatar');
        this.avatar_thumb = CommonFunc.safeGetKeyValue(obj,'avatar_thumb');
        this.coin = CommonFunc.safeGetKeyValue(obj,'coin');
        this.like_count = CommonFunc.safeGetKeyValue(obj,'like_count');
        this.dislike_count = CommonFunc.safeGetKeyValue(obj,'dislike_count');
        this.date_joined = CommonFunc.safeGetKeyValue(obj,'date_joined');
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    updateAvatar(url) {
        this.avatar_url = url;
    }

    toJson() {
        return {
            id: this.id,
            username: this.username,
            avatar: this.avatar,
            avatar_thumb: this.avatar_thumb,
            staySignedIn:this.staySignedIn,
            loggedIn:this.loggedIn,
            email: this.email,
            
            extra: Hasher.encode(this.username,this.password),
            token: Hasher.encode(this.username,this.token),          
        }
    }

    fromJson(obj) {
        this.id = obj.id;
        this.username = obj.username;
        this.avatar = obj.avatar;
        this.avatar_thumb = obj.avatar_thumb;
        this.staySignedIn =obj.staySignedIn;
        this.loggedIn = obj.loggedIn;
        this.email = obj.email;
        
        if (obj.hasOwnProperty('extra')) {
            this.password = Hasher.decode(this.username,obj.extra);
        } else {
            this.password = '';
        }
        
        this.token = Hasher.decode(this.username,obj.token);
    }

    getToken() {
        return this.token;
    }
  
    loadPortfolio(portfolio_id)  {
        const _this = this;
        return new Promise(function(resolve,reject) {   
            _this.portfolio.load(_this.username,portfolio_id).then( response => {
                resolve(response);
            });
        });
    }


    static loadProfile(username) {    
        let dic_param = {'username':username};
        return new Promise(function(resolve,reject) {
            AuthService.getUserProfile(dic_param,function(response) {
                logger.log.debug("UserModel.loadProfile - response",response);
                
                if (response.data.results.length==0) {
                  reject();
                }
  
                const obj = response.data.results[0];
                
                let v_user = new User();            
                v_user.assign(obj);
  
                resolve(v_user);
  
            },function(err) {
                logger.log.error("ProfileView.loadUserProfile - error",err);
                reject();
            });
        });
    }

    signUp(dic_param) {
        const _this=this;

        return new Promise(function(resolve,reject) {
            AuthService.signUp(dic_param,function(response) {
                logger.log.debug("UserModel.signUp.response=",response);
                dic_param.stay_loggedin = true;
                _this.signIn(dic_param).then( resp => {
                    resolve(resp);
                });
                
            }, function(response) {
                if (response.status==400) {
                    reject(response);
                }
            });
        });
    }

    signIn(dic_param) {
        const _this = this;

        return new Promise(function(resolve,reject) {    
            AuthService.signIn(dic_param,function(response) {
            logger.log.debug("onSignIn.response=",response);
            
            _this.processLogin(response.data.auth_token, dic_param.stay_loggedin).then( resp => {
                
                logger.log.debug("onSignIn.response2=",resp.data);

                _this.username = resp.data.username;
                _this.id = resp.data.id;
                _this.email = resp.data.email;
                _this.token = response.data.auth_token;            
                _this.staySignedIn = dic_param.stay_loggedin;
                _this.password = dic_param.password;
                _this.loggedIn = true;

                _this.saveToCookie();

                resolve(response);
            });


            }, function(response) {
                logger.log.debug("onSignIn.Error - response=",response);
                if (response.status==400) {
                    reject(response);
                }
            });
        });

    }


    signOut() {
        const _this = this;
        let dic_param = {token:this.getToken()};

        logger.log.debug("User.signOut");
        return new Promise(function(resolve,reject) {    
            AuthService.signOut(dic_param,function(response) {          
            _this.processLogout();
            logger.log.debug("User.signOut - done");
            resolve(response);
        }, function(response) {
            logger.log.debug("onClickSignOut.Error - response=",response);
            if (response.status==400) {
                reject(response);
            }
        });
        });

    }

    processLogout() {
        this.loggedIn = false;
        this.saveToCookie();
    }

    processLogin(auth_token) {
        return new Promise(function(resolve,reject) {    
            let dic_param = {token:auth_token};
            AuthService.getUserinfo(dic_param,function(response) {
                logger.log.debug("processLogin.response=",response);
                resolve(response);
            }, function(response) {
                logger.log.debug("processLogin.Error - response=",response);
                if (response.status==400) {
                    reject(response);
                }
            });

        });

    }

    saveToCookie() {
        logger.log.debug("saveToCookie=",this.toJson());
        LocalStorageService.save('auth',this.toJson());
    }

    loadFromCookie()
    {
        //"b115a4bd60cb0cf081976f2c1605ff2ce922023f"
        let auth_data = LocalStorageService.load('auth');
 
        //logger.log.debug('loadFromCookie=',auth_data);
        this.fromJson(auth_data);
        logger.log.debug('loadFromCookie=',auth_data);
    }

    updateProfile() {
        const _this = this;
        
        let dic_param = {
            id:this.id,
            username:this.username,
            first_name:this.first_name,
            last_name:this.last_name,
            biography:this.biography,
            title:this.title,
            avatar:this.avatar,
            avatar_thumb:this.avatar_thumb,
            token:store.getters.token
        };
        //dic_param.token = v_user.token;
        logger.log.debug("UserModel.updateUserProfile :  dic_param=",dic_param);

        return new Promise(function(resolve,reject) {
            AuthService.updateUserProfile(dic_param,function(response) {
                logger.log.debug("UserModel.updateUserProfile - response",response.data);
                resolve(response.data);

            },function(err) {
                logger.log.error("UserModel.updateUserProfile - error",err);                
                reject(err);
            });
        });            
    }

}
<template>

    <div class="q-pa-md q-gutter-sm">            

        <!-- <div> -->
            <!-- <CTitle class="text-center gBoxNoMargin" ttype='title' title="답변쓰기" desc=""></CTitle> -->
        <!-- </div> -->
        
        <WWriterToolbar ref="writerToolbar" @onClickSave="onClickSave" />

        <div>

            <div style="padding:6px 0px 18px 0px">
                <q-icon class="QuestionIcon" name="help_outline" /> 
                <span class="gSubTitleMD">{{v_post.title}}</span>
            </div>

            <div class="gBoxNoMargin" >
                <BaseEditor ref="baseEditor" @onPostSave="onPostSave" />
            </div>

            <div v-if="v_error.text.error">
                {{v_error.text.msg}}
            </div>
        </div>
        
    </div>

</template>

<script>
import CommonFunc from 'src/util/CommonFunc';
import logger from 'src/error/Logger';

import CTitle from 'components/CTitle';
import {AnswerPageModel} from "src/models/PageModel";
import BaseEditor from 'components/BaseEditor';
import WWriterToolbar from 'components/WWriterToolbar';

export default {
    name: 'AnswerWriterView',
    components: {
        CTitle,
        BaseEditor,
        WWriterToolbar
    },
    computed: {
        isNewPost() {
            if (this.v_post.id) {
                return false;
            }
            return true;
        }
    },
    data() {
        return {
            g_data: '',
            
            v_show: false,
            v_post: new AnswerPageModel(),
            
            v_page: {title:this.$t('page.cryptovc.title'), desc:''},
            v_error: {
                title: {error:false, msg:''},
                text: {error:false, msg:''},
            },                    
        }
    },

    created() {
        logger.log.debug("AnswerWriterView.created");
    },
    mounted() {
        logger.log.debug("AnswerWriterView.mounted : param=",this.$route.params);
        this.setPost(this.$route.params.post);
        this.prepare();
    },
    updated() {
        
    },
    
    methods: {      
        setPost(post) {
            this.v_post = post;
        },

        prepare() {
            logger.log.debug("AnswerWriterView.prepare");
            if (this.$refs.baseEditor) {
                this.$refs.baseEditor.setPostModel(this.v_post);
            }            
        },

        setPostID(id) {
            this.v_post.id = id;
        },

        validate(v_post) {
            let a_text = this.$refs.baseEditor.getContents();
            if (CommonFunc.isEmptyObject(a_text)) {
                this.v_error.text.error = true;
                this.v_error.text.msg = 'Please type something';
                return false;
            }

            return true;
        },

        onClickSave() {                        
            logger.log.debug('onClickSave - ',this.v_post);

            if (! this.validate(this.v_post)) {
                return;
            }
            
            let v_post = this.v_post;
            v_post.question_id = this.v_post.question_id;

            
            let a_text = this.$refs.baseEditor.getContents();

            let tags = [];
            for (let index=0;index<this.v_post.api_tags.length;index++) {
                if (a_text.indexOf(this.v_post.api_tags[index].name)==-1) {
                    tags.push(this.v_post.api_tags[index].name);
                }                
            }

            this.$refs.writerToolbar.setLoading(true);
            this.$refs.baseEditor.save(this.v_post,tags);

            //this.$refs.baseEditor.save(v_post);
        },

        onPostSave(dic_param) {
            logger.log.debug('onPostSave - ',dic_param);

            this.$refs.writerToolbar.setLoading(false);
            if (dic_param.ret==1) {
                this.$refs.writerToolbar.onClickClose();
                //this.postProcess(dic_param.response);
                //CommonFunc.showOkMessage(this,'Blog posted');
            } else {
                CommonFunc.showErrorMessage(this,'Blog error');
            }
            
        },

    }

};
</script>


<style scoped>
.QuestionIcon {
    color:#00C73C;
    font-size:35px;
    padding:0px 8px 9px 0px;
}

.Question {
    font-size:20px;
    color:#000000;
}
</style>
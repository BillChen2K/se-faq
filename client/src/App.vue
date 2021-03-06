<template>
  <v-app>
    <v-navigation-drawer app v-model="drawer">
      <side-navigation :questions="questions"></side-navigation>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-col md="11" lg="9">
            <welcome-header></welcome-header>
            <notice :key="item.content" v-for="item in notices" :content="item.content" :title="item.title"
                    :icon="item.icon"></notice>
            <v-card class="mt-2" loading v-if="loading">
              <v-card-text>Loading...</v-card-text>
            </v-card>
            <q-a-item-list :questions="questions"></q-a-item-list>
            <Footer @loginStatusChanged="loginStatusChanged"></Footer>
          </v-col>
        </v-row>
      </v-container>
      <question-creator v-on:submit="fetchData"></question-creator>
    </v-main>
  </v-app>
</template>

<script>
import WelcomeHeader from "@/components/WelcomeHeader";
import Footer from "@/components/Footer";
import QAItemList from "@/components/QAItemList";
import Notice from "@/components/Notice";
import SideNavigation from "@/components/SideNavigation";
import QuestionCreator from "@/components/QuestionCreator";
import axios from 'axios';
import config from "../config.js"
import {format} from 'date-fns'
import pangu from 'remark-pangu';
import remark from 'remark';

export default {
  name: 'App',
  components: {
    WelcomeHeader, Footer, Notice, SideNavigation, QuestionCreator, QAItemList
  },
  data: () => ({
    drawer: true,
    loading: true,
    notices: [
      {
        icon: "mdi-information-outline",
        title: "一个提示",
        content: "所有问题/答案发表后便无法再次编辑，除非被踩的次数过多被自动隐藏。畅所欲言之时，也请稍加谨慎。\n" +
            "使用右下角的加号来提出问题，点击问题即可添加回复。回复和提问均支持 <a target='_blank' href='https://guides.github.com/features/mastering-markdown/'>Markdown</a> 语法。"
      }
    ],
    questions: []
  }),


  methods: {
    fetchData() {
      this.loading = true;
      axios.get(config.api + '/question')
          .then(resQ => {
            let q = resQ.data.data;
            q = q.sort((a, b) => {
              return a.timestamp < b.timestamp ? 1 : -1;
            });
            q = q.filter(one => !one.hide);
            q = q.map(one => {
              one.timestamp = format(new Date(one.timestamp), 'yyyy-MM-dd HH:mm:ss');
              remark().use(pangu).process(one.content, (err, doc) => {
                one.content = String(doc);
              });
              return one;
            })

            this.questions = q;
          })
          .finally(() => {
            this.loading = false;
          })
    },

    fillRecord() {
      axios.get(config.api + '/record')
          .then(res => {
            let record = res.data.data;
            let localUpvotedAnswers = [], localDownvotedAnsers = [];
            record.forEach(one => {
              if (one.operation === 'upvote') {
                localUpvotedAnswers.push(one.answer_id);
              } else if (one.operation === 'downvote') {
                localDownvotedAnsers.push(one.answer_id);
              }
            })
            localStorage.upvoted = JSON.stringify(localUpvotedAnswers);
            localStorage.downvoted = JSON.stringify(localDownvotedAnsers);
          });
    },
    // When login status changed, reload data
    loginStatusChanged() {
      this.reloadData();
    },
    reloadData() {
      this.questions = [];
      this.fillRecord();
      this.fetchData();
    }
  },
  mounted() {
    document.title = "Hello, SE.";
    this.reloadData();
  }
};
</script>

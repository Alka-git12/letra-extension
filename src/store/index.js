import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

const currentLanguagesCount = 5;

const state = {
  dailyData: {
    word: {},
    language: {},
    quote: {},
    photo: { user: {}},
  },
  hasError: false,
  languageOptions: [],
  selectedLanguages: [],
  loading: false,
};

export default new Vuex.Store({
  state,
  actions: {
    getSelectedLanguages({ commit, dispatch }) {
      commit('setLoading', true);
      chrome.storage.sync.get("selectedLanguages", (response) => {
        let { selectedLanguages } = response;
        if (selectedLanguages.length === 0 || selectedLanguages === undefined) {
          selectedLanguages = ['german'];
        }
        dispatch('saveSelectedLanguages', selectedLanguages);
        commit('setSelectedLanguages', selectedLanguages);
        dispatch('getDailyData');
      });
    },
    saveSelectedLanguages({}, selectedLanguages) {
      chrome.storage.sync.set({ selectedLanguages });
    },
    getDailyData({ commit, dispatch }) {
      chrome.storage.sync.get("dailyData", (response) => {
        const data = response.dailyData;
        if (!!data && data.created_at == new Date().toDateString()) {
          dispatch('saveDailyData', data);
          commit('setLoading', false);
        } else dispatch('retrieveDailyData');
      });
    },
    retrieveDailyData({ commit, dispatch }) {
      commit('setLoading', true);
      const languages = state.selectedLanguages.join(",");
      axios.get(`${process.env.VUE_APP_API_URL}/daily?languages=${languages}`)
        .then(response => {
          const { data } = response;
          data.created_at = new Date().toDateString();
          chrome.storage.sync.set({ dailyData: data });
          dispatch('saveDailyData', data);
          commit('setLoading', false);
        })
        .catch(error => commit('setHasError', true));
    },
    saveDailyData({ commit }, data) {
      commit('setDailyData', data);
    },
    getLanguageOptions({ dispatch }) {
      chrome.storage.sync.get("languageOptions", (response) => {
        const data = response.languageOptions;
        if (!!data && data.length === currentLanguagesCount) dispatch('saveLanguageOptions', data);
        else dispatch('retrieveLanguageOptions');
      });
    },
    retrieveLanguageOptions({ dispatch }) {
      axios.get(`${process.env.VUE_APP_API_URL}/languages`)
        .then(response => {
          const options = Object.keys(response.data.languages);
          chrome.storage.sync.set({ languageOptions: options });
          dispatch('saveLanguageOptions', options);
        })
        .catch(error => commit('setHasError', true));
    },
    saveLanguageOptions({ commit }, options) {
      commit('setLanguageOptions', options);
    },
  },
  mutations: {
    setDailyData(state, data) {
      state.dailyData = data;
    },
    setLanguageOptions(state, languageOptions) {
      state.languageOptions = languageOptions;
    },
    setSelectedLanguages(state, selectedLanguages) {
      state.selectedLanguages = selectedLanguages;
    },
    setHasError(state, hasError) {
      state.hasError = hasError;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
  }
})
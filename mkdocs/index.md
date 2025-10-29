---
title: k0rdent Application Catalog
template: home.html
---
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<div id="app">
  <div class="maintabs">
    <input type="radio" id="apps" name="maintabs" checked="checked" @change="switchedTabs($event)">
    <label for="apps"><img src="img/icon-apps.svg" />Applications</label>
    <div class="tab tab_apps-content">
        <div class="tab_apps-top">
            <div class="left-side">
              <h2>Find and deploy the software your business needs</h2>
              <p>The application catalog features a selection of best-in-class solutions designed to enhance k0rdent managed clusters. These services have been
              <a href="./testing_methodology">validated</a>
              on k0rdents clusters and have existing templates for easy deployment.</p>
            </div>
            <div class="right-side">
              <div class="filters-section">
                  <div class="select-wrapper">
                    <label for="ordering-apps">Sort: </label>
                    <select id="ordering-apps" v-model="orderingApps">
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                        <option value="newest">By Newest</option>
                    </select>
                  </div>
              </div>
            </div>
        </div>
        <div class="tab_apps-bottom">
          <div class="tab_apps-sidebar">
            <p class="categories-title" @click="toggleExpanded($event)">Categories: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></p>
            <div id="filterTagsApps" class="expandable-list">
              <div v-for="tag in [...tagsSet].sort((a, b) => a.localeCompare(b))">
                <input type="checkbox" 
                  :id="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  :name="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  :value="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  v-model="checkboxesCategory">
                <label :for="tag.replace(/[ /]/g, '-').toLowerCase()">{{ tag }}</label>
              </div>
              <br>
            </div>
            <p class="categories-title" @click="toggleExpanded($event)">Support: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></p>
            <div id="filterTagsApps" class="expandable-list">
              <div v-for="tag in [...supportTypeSet].sort((a, b) => a.localeCompare(b))">
                <input type="checkbox" 
                  :id="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  :name="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  :value="tag.replace(/[ /]/g, '-').toLowerCase()" 
                  v-model="checkboxesSupport">
                <label :for="tag.replace(/[ /]/g, '-').toLowerCase()">{{ tag }}</label>
              </div>
              <br>
            </div>
          </div>
          <div class="tab_apps-main-content">
            <p><b>{{dataAppsFiltered.length}}</b> items</p>
            <div id="cards-apps" class="grid">
              <a class="card" :href="card.link" v-for="card in dataAppsFiltered">
                <span 
                  class="support-badge" 
                  :class="card.support_type.toLowerCase()"
                  v-if="card.support_type">{{ card.support_type }}</span>
                <img :src="updateRelLink(card.logo, card.type, card.appDir)" alt="logo" />
                <p>
                  <b>{{ card.title }}</b>
                <br>
                {{ card.description }}
                </p>
              </a>
            </div>
          <!-- <button class="btn-show-more-apps">Show More</button>  -->
        </div>
      </div>
    </div>
    <input type="radio" id="infra" name="maintabs" @change="switchedTabs($event)">
    <label for="infra"><img src="img/icon-infra.svg" />Infrastructure</label>
    <div class="tab tabs_infra-content">
      <div class="tab_apps-top">
          <div class="left-side">
            <h2>Deploy Kubernetes Clusters Anywhere</h2>
            <p>k0rdent is designed to be a versatile and adaptable multi-cluster Kubernetes management system that can deploy and manage Kubernetes clusters across a wide range of infrastructure environments.</p>
          </div>
          <div class="right-side">
            <div class="filters-section">
              <div class="select-wrapper">
                  <label for="ordering-infra">Sort: </label>
                  <select id="ordering-infra" v-model="orderingInfra">
                      <option value="asc">A-Z</option>
                      <option value="desc">Z-A</option>
                      <option value="newest">By Newest</option>
                  </select>
              </div>
            </div>
          </div>
      </div>
      <div class="tabs_infra-main-content">
        <div id="cards-infra" class="grid">
          <a class="card" :href="card.link" v-for="card in dataInfra">
            <span 
              class="support-badge" 
              :class="card.support_type.toLowerCase()"
              v-if="card.support_type">{{ card.support_type }}</span>
            <img :src="updateRelLink(card.logo, card.type, card.appDir)" alt="logo" />
            <p>
              <b>{{ card.title }}</b>
            <br>
            {{ card.description }}
            </p>
          </a>
        </div>
        <!-- <button class="btn-show-more-infra">Show More</button> -->
      </div>
    </div>
  </div>
</div>


<script>
  const { createApp, ref, onMounted, computed, watch, router } = Vue

  createApp({
    setup() {
      //vars
      const data = ref([])
      const dataInfra = ref([])
      const dataApps = ref([])
      const dataAppsFiltered = ref([])
      const checkboxesCategory = ref([])
      const checkboxesSupport = ref([])
      const tagsSet = new Set()
      const supportTypeSet = new Set()
      const orderingApps = ref('asc')
      const orderingInfra = ref('asc')

      //methods
      const readData = ()=>{
        fetch("fetched_metadata.json")
          .then(response => response.json())
          .then(res => {
            data.value = res
            dataInfra.value = res.filter(item=>item.type === 'infra')
            dataApps.value = res.filter(item=>item.type !== 'infra')
            dataApps.value.forEach(item=>{
              supportTypeSet.add(item.support_type)
              item.tags.forEach(tag =>tagsSet.add(tag));
            })
            dataAppsFiltered.value = dataApps.value
            sorting(dataAppsFiltered.value, 'asc', 'title')
            sorting(dataInfra.value, 'asc', 'title')

            updateCheckboxesFromURL()
          })
      }

      const sorting = (arr, order, sorting_by)=>{
        if(sorting_by==='title'){
          if(order === 'asc'){
            arr.sort((a, b) => a.title.localeCompare(b.title))
          } else {
            arr.sort((a, b) => b.title.localeCompare(a.title))
          }
        }
        if(sorting_by==='created'){
          if(order === 'newest'){
            arr.sort((a, b) => b.created.localeCompare(a.created))
          } else {
            arr.sort((a, b) => a.created.localeCompare(b.created))
          }
        }
      }

      const ordering = (event) => {
        const { id, value } = event;

        let data;
        if (id === 'ordering-apps') {
          data = dataAppsFiltered.value;
        } else if (id === 'ordering-infra') {
          data = dataInfra.value;
        } else {
          return;
        }

        let sorting_by;
        if (value === 'asc' || value === 'desc') {
          sorting_by = 'title';
        } else if (value === 'newest') {
          sorting_by = 'created';
        } else {
          return;
        }

        sorting(data, value, sorting_by);
      };

      const updateRelLink = (link, type, appName) => {
        if (link.startsWith("./")) {
          if (type == "infra") {
            return link.replace("./", `./infra/${appName}/`)
          } else {
            return link.replace("./", `./apps/${appName}/`)
          }
        }
        return link;
      }

      const updateURL = () => {
        const params = new URLSearchParams();

        if (checkboxAppsNormalized.value.length) {
          params.set('category', checkboxAppsNormalized.value.join(','));
        }

        if (checkboxesSupportNormalized.value.length) {
          params.set('support_type', checkboxesSupportNormalized.value.join(','));
        }

        if(orderingApps && orderingInfra){
          params.set('sorted_by', 'app-'+orderingApps.value+',infra-'+orderingInfra.value);
        }

        history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      };

      const updateCheckboxesFromURL = () => {
        let params = new URLSearchParams(window.location.search);
        let hash_param = window.location.hash;
        if(document.getElementById(hash_param.replace('#', ''))){
          document.getElementById(hash_param.replace('#', '')).checked = true;
        }
        let selectedCategories = params.get("category");
        let selectedSupportTypes = params.get("support_type");
        let sortedBy = params.get("sorted_by");

        parseUrlParams('checkbox', selectedCategories, checkboxesCategory)
        parseUrlParams('checkbox', selectedSupportTypes, checkboxesSupport)
        parseUrlParams('dropdown', sortedBy, checkboxesSupport)
      }

      const parseUrlParams = (type, selected, checkboxes) => {
        if(selected && type==='checkbox') {
          let selectedArray = selected.split(",");
          selectedArray.forEach(item=>{
            checkboxes.value.push(item)
          })
        } else if(selected){
          let sortedValues = selected.split(",");
          if(sortedValues[0]==='app-newest'){
            orderingApps.value = 'newest'
          }
          if(sortedValues[1]==='infra-newest'){
            orderingInfra.value = 'newest'
          }
        }
      } 

      const switchedTabs = (event)=>{
        if(event.target.id === 'apps'){
          history.replaceState({}, '', '#apps')
        }
        if(event.target.id === 'infra'){
          history.replaceState({}, '', '#infra')
        }
      }

      const toggleExpanded = (event) => {
        event.target.classList.toggle('expanded');
      }

      const normalize = (str) => str.replace(/[ /]/g, "-").toLowerCase();

      const checkboxAppsNormalized = computed(()=> checkboxesCategory.value.map(normalize))
      const checkboxesSupportNormalized = computed(()=> checkboxesSupport.value.map(normalize))

      onMounted(() => {
        readData()
        document.addEventListener("DOMContentLoaded", function () {
          // Loop through all keys in localStorage
          for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              if (key && key.includes("__tabs")) {
                  localStorage.removeItem(key);
                  break; // Stop after finding and removing the key
              }
          }
        });
      })

      // watch funxtion eatches for the changes in the checkboxesCategory and checkboxesSupport (input boxes) and then filter dataApps items to match with the appsMAtch and supportMatch
      watch([checkboxesCategory, checkboxesSupport], () => {
        dataAppsFiltered.value = dataApps.value.filter(item => {
          const tags = item.tags.map(normalize);
          const supportType = normalize(item.support_type);

          const appsMatch = checkboxesCategory.value.length === 0 ||
            checkboxesCategory.value.every(checkbox => tags.includes(normalize(checkbox)));

          const supportMatch = checkboxesSupport.value.length === 0 ||
            checkboxesSupport.value.every(checkbox => supportType === normalize(checkbox));
          
          return appsMatch && supportMatch;
        });
        ordering({id: 'ordering-apps', value: orderingApps.value})
        ordering({id: 'ordering-infra', value: orderingInfra.value})

        updateURL();
      }, { deep: true });

      watch([orderingApps], () => {
        ordering({id: 'ordering-apps', value: orderingApps.value})
        updateURL();
      }, { deep: true });
      watch([orderingInfra], () => {
        ordering({id: 'ordering-infra', value: orderingInfra.value})
        updateURL();
      }, { deep: true });

      return {
        data,
        dataInfra,
        dataApps,
        dataAppsFiltered,
        updateRelLink,
        tagsSet,
        supportTypeSet,
        ordering,
        orderingApps,
        orderingInfra,
        checkboxesCategory,
        checkboxesSupport,
        toggleExpanded,
        switchedTabs
      }
    }
  }).mount('#app')
  
</script>
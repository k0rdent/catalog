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
              <p>The application catalog features a selection of best-in-class solutions designed to enhance k0rdent managed clusters. These services have been validated on k0rdents clusters and have existing templates for easy deployment.</p>
            </div>
            <div class="right-side">
              <div class="filters-section">
                  <div class="select-wrapper">
                    <label for="ordering-apps">Sort: </label>
                    <select id="ordering-apps" @change="ordering">
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
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
                  v-model="checkboxesApps">
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
                  v-model="checkboxesAppsSupport">
                <label :for="tag.replace(/[ /]/g, '-').toLowerCase()">{{ tag }}</label>
              </div>
              <br>
            </div>
          </div>
          <div class="tab_apps-main-content">
            <div id="cards-apps" class="grid">
              <a class="card" :href="card.link" v-for="card in data_apps_filtered">
                <img :src="updateRelLink(card.logo, card.appDir)" alt="logo" />
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
                  <select id="ordering-infra" @change="ordering">
                      <option value="asc">A-Z</option>
                      <option value="desc">Z-A</option>
                  </select>
              </div>
            </div>
          </div>
      </div>
      <div class="tabs_infra-main-content">
        <div id="cards-infra" class="grid">
          <a class="card" :href="card.link" v-for="card in data_infra">
            <img :src="updateRelLink(card.logo, card.appDir)" alt="logo" />
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
      const data_infra = ref([])
      const data_apps = ref([])
      const data_apps_filtered = ref([])
      const checkboxesApps = ref([])
      const checkboxesAppsSupport = ref([])
      const tagsSet = new Set()
      const supportTypeSet = new Set()

      //methods
      const readData = ()=>{
        fetch("fetched_metadata.json")
          .then(response => response.json())
          .then(res => {
            data.value = res
            data_infra.value = res.filter(item=>item.type === 'infra')
            data_apps.value = res.filter(item=>item.type !== 'infra')

            data_apps.value.forEach(item=>{
              if(item.support_type !==''){
                supportTypeSet.add(item.support_type)
              } else {
                // add support_type "Community" to all items that doesn't have "Enterprise"-tag
                item.support_type = "Community"
                supportTypeSet.add(item.support_type)
              }
              item.tags.forEach(tag =>tagsSet.add(tag));
            })
            data_apps_filtered.value = data_apps.value
            sortingByTitle(data_apps_filtered.value, 'asc')
            sortingByTitle(data_infra.value, 'asc')

            updateCheckboxesFromURL()
          })
      }

      const sortingByTitle = (arr, order)=>{
        if(order === 'asc'){
          arr.sort((a, b) => a.title.localeCompare(b.title))
        } else {
          arr.sort((a, b) => b.title.localeCompare(a.title))
        }
      }

      const ordering = (event) => {
        if(event.target.id==='ordering-apps'){
          if(event.target.value === 'asc'){
            sortingByTitle(data_apps_filtered.value, 'asc')
          } else {
            sortingByTitle(data_apps_filtered.value, 'desc')
          }
        }
        if(event.target.id==='ordering-infra'){
          if(event.target.value === 'asc'){
            sortingByTitle(data_infra.value, 'asc')
          } else {
            sortingByTitle(data_infra.value, 'desc')
          }
        }
      }

      const updateRelLink = (link, appName) => {
        if (link.startsWith("./")) {
          return link.replace("./", `./apps/${appName}/`)
        }
        return link;
      }

      const updateURL = () => {
        const params = new URLSearchParams();

        if (checkboxAppsNormalized.value.length) {
          params.set('category', checkboxAppsNormalized.value.join(','));
        }

        if (checkboxesAppsSupportNormalized.value.length) {
          params.set('support_type', checkboxesAppsSupportNormalized.value.join(','));
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

        parseUrlParams(selectedCategories, checkboxesApps)
        parseUrlParams(selectedSupportTypes, checkboxesAppsSupport)
      }

      const parseUrlParams = (selected, checkboxes) => {
        if(selected) {
          let selectedArray = selected.split(",");
          selectedArray.forEach(item=>{
            checkboxes.value.push(item)
          })
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

      const checkboxAppsNormalized = computed(()=> checkboxesApps.value.map(normalize))
      const checkboxesAppsSupportNormalized = computed(()=> checkboxesAppsSupport.value.map(normalize))

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

      // watch funxtion eatches for the changes in the checkboxesApps and checkboxesAppsSupport (input boxes) and then filter data_apps items to match with the appsMAtch and supportMatch
      watch([checkboxesApps, checkboxesAppsSupport], () => {

        data_apps_filtered.value = data_apps.value.filter(item => {
          const tags = item.tags.map(normalize);
          const supportType = normalize(item.support_type);

          const appsMatch = checkboxesApps.value.length === 0 ||
            checkboxesApps.value.every(checkbox => tags.includes(normalize(checkbox)));

          const supportMatch = checkboxesAppsSupport.value.length === 0 ||
            checkboxesAppsSupport.value.every(checkbox => supportType === normalize(checkbox));

          return appsMatch && supportMatch;
        });

        updateURL();
      }, { deep: true });

      return {
        data,
        data_infra,
        data_apps,
        data_apps_filtered,
        updateRelLink,
        tagsSet,
        supportTypeSet,
        ordering,
        checkboxesApps,
        checkboxesAppsSupport,
        toggleExpanded,
        switchedTabs
      }
    }
  }).mount('#app')
  
</script>

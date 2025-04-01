---
title: k0rdent Application Catalog
template: home.html
---
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<div id="app">
  <div class="maintabs">
    <input type="radio" id="tab_apps" name="maintabs" checked="checked">
    <label for="tab_apps"><img src="img/icon-apps.svg" />Applications</label>
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
          <button @click="checkboxesApps.push('database')">add</button>
            <p class="categories-title">Categories: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></p>
            <div id="filterTagsApps">
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
          </div>
          <div class="tab_apps-main-content">
            <div id="cards-apps" class="grid">
              <a class="card" v-for="card in data_apps_filtered">
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
    <input type="radio" id="tabs_infra" name="maintabs">
    <label for="tabs_infra"><img src="img/icon-infra.svg" />Infrastructure</label>
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
          <a class="card" v-for="card in data_infra">
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
      const tagsSet = new Set()

      //methods
      const readData = ()=>{
        fetch("fetched_metadata.json")
          .then(response => response.json())
          .then(res => {
            data.value = res
            data_infra.value = res.filter(item=>item.type === 'infra')
            data_apps.value = res.filter(item=>item.type !== 'infra')

            data_apps.value.forEach(item=>{
              item.tags.forEach(tag => tagsSet.add(tag));
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
        let queryString = checkboxAppsNormalized.value.length ? `?category=${checkboxAppsNormalized.value.join(",")}` : "";
        history.replaceState({}, '', window.location.pathname + queryString)
      }

      function updateCheckboxesFromURL() {
        let params = new URLSearchParams(window.location.search);
        let selectedCategories = params.get("category");
        if (selectedCategories) {
          let selectedArray = selectedCategories.split(",");
          selectedArray.forEach(item=>{
            console.log('pushed ', item)
            checkboxesApps.value.push(item)
          })
        }
      }

      const checkboxAppsNormalized = computed(()=>{
        return checkboxesApps.value.map(item=>{
          return item.replace(/[ /]/g, "-").toLowerCase();
        })
      })

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

      watch(checkboxesApps, (newVal, oldVal) => {
        if(newVal.length>0){
          data_apps_filtered.value = data_apps.value.filter(item=>{
            return item.tags.some( elem => checkboxesApps.value.includes(elem.replace(/[ /]/g, "-").toLowerCase()) )
          })
        } else {
          data_apps_filtered.value = data_apps.value
        }
        updateURL()
      }, { deep: true })

      return {
        data,
        data_infra,
        data_apps,
        data_apps_filtered,
        updateRelLink,
        tagsSet,
        ordering,
        checkboxesApps
      }
    }
  }).mount('#app')

// fetch("fetched_metadata.json")
//   .then(response => response.json())
//   .then(data => {
//     let data_infra = []
//     let data_apps = []
//     data.forEach(item=>{
//       if(item.type === 'infra'){
//         data_infra.push(item)
//       } else {
//         data_apps.push(item)
//       }
//     })

//     // elements init
//     let list_apps = document.getElementById("cards-apps");
//     let select_apps = document.getElementById("filterTagsApps");
//     let ordering_apps = document.getElementById("ordering-apps");

//     let list_infra = document.getElementById("cards-infra");
//     let select_infra = document.getElementById("filterTags");
//     let ordering_infra = document.getElementById("ordering-infra");

//     // let tagsSet = new Set();

//     //fulfill the apps-tags checkboxes
//     // data_apps.forEach(item=>{
//     //     item.tags.forEach(tag => tagsSet.add(tag));
//     // })
//     // select_apps.innerHTML = [...tagsSet]
//     //   .sort((a, b) => a.localeCompare(b))
//     //   .map(tag => 
//     //   `<input type="checkbox" id="${tag}" name="${tag}" value="${tag}"><label for="${tag}">${tag}</label><br>`)
//     //   .join("");

//     let filtered_apps = [];
//     let filtered_infra = [];

//     // function updateRelLink(link, appName) {
//     //   if (link.startsWith("./")) {
//     //     return link.replace("./", `./apps/${appName}/`)
//     //   }
//     //   return link;
//     // }

//     //main function for rendering
//     function renderList(items_apps, items_infra) {
//       return
//       function renderToHtml(items, list){
//         if(items!==null){
//           list.innerHTML = "";
//           items.forEach(item => {
//             let logo = updateRelLink(item.logo, item.appDir);
//             let a = document.createElement("a");
//             a.href = item.link;
//             a.className = "card";
//             let tagString = item.tags.join(", ");
//             a.setAttribute("data-tags", item.tags.join(" "));
//             a.innerHTML = `
//                 <img src="${logo}" alt="logo"/>
//                 <p>
//                 <b>${item.title}</b>
//                 <br />
//                 ${item.description}
//                 </p>`;
//             list.appendChild(a);

//             item.tags.forEach(tag => tagsSet.add(tag));
//           });
//         }
//       }
//       renderToHtml(items_apps, list_apps)
//       renderToHtml(items_infra, list_infra)
//     }

//     // Function to update URL based on selected filters
//     function updateURL() {
//       let checkboxes = document.querySelectorAll('#filterTagsApps input[type="checkbox"]')
//       let selected = Array.from(checkboxes)
//           .filter(checkbox => checkbox.checked)
//           .map(checkbox => checkbox.value);

//       let queryString = selected.length ? `?category=${selected.join(",")}` : "";
//       history.replaceState(null, "", window.location.pathname + queryString);
//     }

//     // Function to update checkboxes based on URL
//     function updateCheckboxesFromURL() {
//       let checkboxes = document.querySelectorAll('#filterTagsApps input[type="checkbox"]')
//       let params = new URLSearchParams(window.location.search);
//       let selectedCategories = params.get("category");
//       if (selectedCategories) {
//         let selectedArray = selectedCategories.split(","); // Convert back to array
//         checkboxes.forEach(checkbox => {
//             checkbox.checked = selectedArray.includes(checkbox.value);
//         });
//         getSelectedCheckboxes()
//       }
//     }

//     //initially render by ascending order
//     renderList(data_apps.sort((a, b) => a.title.localeCompare(b.title)), data_infra.sort((a, b) => a.title.localeCompare(b.title)));

//     // Event Listeners:
//     // document.querySelectorAll('#filterTagsApps input[type="checkbox"]').forEach(checkbox => {
//     //   checkbox.addEventListener('change', getSelectedCheckboxes);
//     // });
//     function getSelectedCheckboxes() {
//       return
//       const selectedValues = Array.from(document.querySelectorAll('#filterTagsApps input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

//       updateURL();

//       if(selectedValues.length>0){
//         filtered_apps = data_apps.filter(item=>{
//           return item.tags.some( elem => selectedValues.includes(elem) )
//         })
//         renderList(filtered_apps, null);
//       } else {
//         filtered_apps = []
//         renderList(data_apps, null);
//       }


//     }

//     document.querySelector('.categories-title').addEventListener('click', ()=>{
//       document.querySelector('.tab_apps-sidebar').classList.toggle('expanded')
//     })

//     // ordering_apps.addEventListener("change", function () {
//     //     // console.log(filtered)
//     //   let filter = this.value;
//     //   if(filter==='asc'){
//     //     if(filtered_apps.length>0){
//     //         renderList(filtered_apps.sort((a, b) => a.title.localeCompare(b.title)), null);
//     //     } else {
//     //         renderList(data_apps.sort((a, b) => a.title.localeCompare(b.title)), null);
//     //     }
        
//     //   }
//     //   if(filter==='desc'){
//     //     if(filtered_apps.length>0){
//     //         renderList(filtered_apps.sort((a, b) => b.title.localeCompare(a.title)), null)
//     //     } else {
//     //         renderList(data_apps.sort((a, b) => b.title.localeCompare(a.title)), null);
//     //     }
//     //   }
//     // });

//     // ordering_infra.addEventListener("change", function () {
//     //     // console.log(filtered)
//     //   let filter = this.value;
//     //   if(filter==='asc'){
//     //     if(filtered_infra.length>0){
//     //         renderList(null, filtered_infra.sort((a, b) => a.title.localeCompare(b.title)));
//     //     } else {
//     //         renderList(null, data_infra.sort((a, b) => a.title.localeCompare(b.title)));
//     //     }
        
//     //   }
//     //   if(filter==='desc'){
//     //     if(filtered_infra.length>0){
//     //         renderList(null, filtered_infra.sort((a, b) => b.title.localeCompare(a.title)))
//     //     } else {
//     //         renderList(null, data_infra.sort((a, b) => b.title.localeCompare(a.title)));
//     //     }
//     //   }
//     // });

//     // Initialize checkboxes from URL on page load
//     updateCheckboxesFromURL();

//     //show-more buttons
//     // document.querySelector('.btn-show-more-apps').addEventListener('click', function(){
//     //   document.getElementById('cards-apps').classList+=' show-more';
//     // })
//     // document.querySelector('.btn-show-more-infra').addEventListener('click', function(){
//     //   document.getElementById('cards-infra').classList+=' show-more';
//     // })

//   });
  
</script>

---
title: k0rdent Application Catalog
template: home.html
---

# k0rdent Application Catalog
Unlock the full potential of the k0rdent Distributed Container Management Environment with a catalog of complementary services. The catalog features a selection of best-in-class solutions designed to enhance k0rdent managed clusters. These services have been validated on k0rdents clusters and have existing templates for easy deployment. Please check back often as the list is continuously growing.

<div class="filters-section">
    <div class="select-wrapper">
        <label for="filterTags">Filter By Tags: </label>  
        <select id="filterTags">
            <option value="all">All</option>
        </select>
    </div>
    <div class="select-wrapper">
        <label for="ordering">Order By Title: </label>
        <select id="ordering">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
        </select>
    </div>
</div>

<div id="cards" class="grid"></div>

<script>
fetch("fetched_metadata.json")
  .then(response => response.json())
  .then(data => {
    // console.log(data)
    let list = document.getElementById("cards");
    let select = document.getElementById("filterTags");
    let ordering = document.getElementById("ordering");

    let tagsSet = new Set();

    //fulfill the tags dropdown
    data.forEach(item=>{
        item.tags.forEach(tag => tagsSet.add(tag));
    })
    select.innerHTML = `<option value="all">All</option>` + 
        [...tagsSet].map(tag => `<option value="${tag}">${tag}</option>`).join("");

    let filtered = [];

    //main function for rendering
    function renderList(items) {
      list.innerHTML = "";
      items.forEach(item => {
        let a = document.createElement("a");
        a.href = item.link;
        a.className = "card";
        let tagString = item.tags.join(", ");
        a.setAttribute("data-tags", item.tags.join(" "));
        a.innerHTML = `
            <img src="${item.logo}" alt="logo"/>
            <p>
            <b>${item.title}</b>
            <span>-</span> ${item.description}
            </p>`;
        list.appendChild(a);

        item.tags.forEach(tag => tagsSet.add(tag));
      });
    }

    //initially render by ascending order
    renderList(data.sort((a, b) => a.title.localeCompare(b.title)));

    select.addEventListener("change", function () {
      let filter = this.value;
      console.log(this.value)
      filtered = filter === "all" ? data : data.filter(item => item.tags.includes(filter));
      renderList(filtered);
    });

    ordering.addEventListener("change", function () {
        // console.log(filtered)
      let filter = this.value;
      if(filter==='asc'){
        if(filtered.length>0){
            renderList(filtered.sort((a, b) => a.title.localeCompare(b.title)));
        } else {
            renderList(data.sort((a, b) => a.title.localeCompare(b.title)));
        }
        
      }
      if(filter==='desc'){
        if(filtered.length>0){
            renderList(filtered.sort((a, b) => b.title.localeCompare(a.title)))
        } else {
            renderList(data.sort((a, b) => b.title.localeCompare(a.title)));
        }
      }
    });
  });

  
</script>

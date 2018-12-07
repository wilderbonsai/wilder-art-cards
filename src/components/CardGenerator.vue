<template>
  <div>
    <div class="wrapper">
      <div class="middle">
        <button class="middle" v-on:click="generateCards()">Generate</button>
      <vue-loading  type="cylon" color="#d9544e" :size="{ width: '200px', height: '300px' }"></vue-loading>
      </div>
    </div>
    <div v-for="card in generatedCards" v-bind:id="'card-' + card.cardId" style="position:absolute;left:-10000px">
      <div style=";height:1800px; width:1000px; padding: 100px; font-size:100px;">
        <h4 style="color: #000; ">Artist Name</h4>
        <img src="../assets/bear.jpg"
             width="1000px" height="auto" >

        <div class="footer">
          <div class="width-50"">Nice Bear</div>
          <div id="qr-code" class="width-50"><vue-qr :bgSrc="bgsrc" :text="card.pin" :size="200"></vue-qr>{{card.cardId}}-{{card.pin}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import domtoimage from 'dom-to-image';
  import html2canvas from 'html2canvas';
  import { VueLoading } from 'vue-loading-template'
  import saveAs from 'file-saver';
  import { changeDpiDataUrl } from 'changedpi'
  import VueQr from 'vue-qr'
  import axios from 'axios'
  import JSZip from 'jszip'
  import bear from '../assets/bear.jpg'
  import logo from '../assets/logo.png'

  export default {
    components: {VueQr, VueLoading},
    name: 'HelloWorld',
    props: {
      msg: String
    },
    mounted: function() {
      console.log('mounted')
    },
    data: function() {
      return {
        generatedCards: [],
        bgsrc: bear,
        logosrc: logo
      }
    },
    methods: {
      generateCards: async function() {
        try {
          var zip = new JSZip();
          const self = this
          //TODO make universal axios in App
          var config = {
            headers: {'Access-Control-Allow-Origin': '*'}
          }
          axios.post('/.netlify/functions/cards_generate', config)
            .then(async function (response) {
              self.generatedCards = response.data;
              let card = self.generatedCards[0]
              setTimeout(async function() {
                for(var i = 0; i < self.generatedCards.length; i++) {
                  console.log('start processing')
                  let card = self.generatedCards[i]
                  let canvas = await html2canvas(document.querySelector(`#card-${card.cardId}`), {letterRendering: 1, allowTaint: true})
                  var dataUrl = canvas.toDataURL("image/png");
                  dataUrl = changeDpiDataUrl(dataUrl,300);
                  zip.file(`${card.cardId}.png`, dataUrl.split('base64,')[1], {base64: true})
                  if(i == self.generatedCards.length - 1) {
                    zip.generateAsync({type:"blob"})
                      .then(function(content) {
                        const firstCardId = self.generatedCards[0].cardId
                        const lastCardId = self.generatedCards[self.generatedCards.length - 1].cardId;
                        saveAs(content, `wildercards_${firstCardId}-${lastCardId}.zip`);
                      });
                  }
                  console.log('finish processing')
                }
              }, 1000)


            })
        } catch(error) {
          if (!error.response) {
            // network error
            errorStatus = 'Error: Network Error';
          } else {
            errorStatus = error.response.data.message;
          }
          console.log(errorStatus)
        }
      }


    }

  }
</script>

<style scoped>
  .width-50 {
    width: 50%;
    float: left;
  }

  .wrapper {
    text-align: center;
    width:100vw;
    max-width:100%;
  }

  .middle {
    margin:0 auto;
    left: 50%;
    position: absolute;
    top: 50%;
  }

</style>
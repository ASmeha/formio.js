export default {
  flat: `
{% component.components.forEach(function(tab, index) { %}
  <h4 class="ui top attached block header">{{ t(tab.label) }}</h4>
  <div class="ui bottom attached segment">
    {{ tabComponents[index] }}
  </div>
{% }) %}
`,
  form: `
<div class="ui top attached tabular menu">
  {% component.components.forEach(function(tab, index) { %}
  <a class="item{{ currentTab === index ? ' active' : ''}}" role="presentation" ref="{{tabLinkKey}}">{{t(tab.label)}}</a>
  {% }) %}
</div>
{% component.components.forEach(function(tab, index) { %}
<div role="tabpanel" class="ui bottom attached tab segment{{ currentTab === index ? ' active' : ''}}" ref="{{tabKey}}"">{{tabComponents[index]}}</div>
{% }) %}
`,
};

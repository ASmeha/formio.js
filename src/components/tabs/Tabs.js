import NestedComponent from '../nested/NestedComponent';

export default class TabsComponent extends NestedComponent {
  static schema(...extend) {
    return NestedComponent.schema({
      label: 'Tabs',
      type: 'tabs',
      input: false,
      key: 'tabs',
      persistent: false,
      components: [
        {
          label: 'Tab 1',
          key: 'tab1',
          components: [],
        },
      ],
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Tabs',
      group: 'layout',
      icon: 'fa fa-folder-o',
      weight: 50,
      documentation: 'http://help.form.io/userguide/#tabs',
      schema: TabsComponent.schema(),
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.currentTab = 0;
    this.validityTabs = [];
    this.erroredTabs = [];
  }

  get defaultSchema() {
    return TabsComponent.schema();
  }

  get schema() {
    const schema = super.schema;

    schema.components = this.component.components.map((tab, index) => {
      if (index === this.currentTab) {
        tab.components = this.getComponents().map((component) => component.schema);
      }

      return tab;
    });

    return schema;
  }

  build(state, showLabel) {
    this.on('submitToTabs', () => {
      this.navigateToErroredTab();
    });
    if (this.options.flatten) {
      this.element = super.createElement();
      this.component.components.forEach((tab) => {
        let body;
        const panel = this.ce('div', {
          id: this.id,
          class: 'mb-2 card border panel panel-default'
        },
          [
            this.ce('div', {
              class: 'card-header bg-default panel-heading'
            },
              this.ce('h4', {
                class: 'mb-0 card-title panel-title'
              }, tab.label)
            ),
            body = this.ce('div', {
              class: 'card-body panel-body'
            })
          ]
        );
        tab.components.forEach(component => this.addComponent(
          component,
          body,
          this.data,
          null,
          null,
          this.getComponentState(component, state)
        ));
        this.element.appendChild(panel);
      });
    }
    else {
      return super.build(state, showLabel);
    }
  }

  createElement() {
    this.tabsBar = this.ce('ul', {
      class: 'nav nav-tabs',
    });
    this.tabsContent = this.ce('div', {
      class: 'tab-content',
    });

    this.tabLinks = [];
    this.tabs = [];
    this.component.components.forEach((tab, index) => {
      const tabLink = this.ce('a', {
        class: 'nav-link',
        href: `#${tab.key}`,
      }, tab.label);
      this.addEventListener(tabLink, 'click', (event) => {
        event.preventDefault();
        this.setTab(index);
      });
      const tabElement = this.ce('li', {
        class: 'nav-item',
        role: 'presentation',
      }, tabLink);
      tabElement.tabLink = tabLink;
      this.tabsBar.appendChild(tabElement);
      this.tabLinks.push(tabElement);

      const tabPanel = this.ce('div', {
        role: 'tabpanel',
        class: 'tab-pane',
        id: tab.key,
      });
      this.tabsContent.appendChild(tabPanel);
      this.tabs.push(tabPanel);
    });

    if (this.element) {
      this.appendChild(this.element, [this.tabsBar, this.tabsContent]);
      this.element.className = this.className;
      return this.element;
    }

    this.element = this.ce('div', {
      id: this.id,
      class: this.className,
    }, [this.tabsBar, this.tabsContent]);
    this.element.component = this;

    return this.element;
  }

  /**
   * Set the current tab.
   *
   * @param index
   */
  setTab(index, state) {
    if (
      !this.tabs ||
      !this.component.components ||
      !this.component.components[this.currentTab] ||
      (this.currentTab >= this.tabs.length)
    ) {
      return;
    }

    this.currentTab = index;

    if (this.options.builder) {
      // Get the current tab.
      const tab = this.component.components[index];
      this.empty(this.tabs[index]);
      this.components.map((comp) => comp.destroy());
      this.components = [];
      const components = this.hook('addComponents', tab.components, this);
      components.forEach((component) => this.addComponent(
        component,
        this.tabs[index],
        this.data,
        null,
        null,
        state,
      ));
      this.restoreValue();
    }

    if (this.tabLinks.length <= index) {
      return;
    }

    this.tabLinks.forEach((tabLink) => this
      .removeClass(tabLink, 'active')
      .removeClass(tabLink.tabLink, 'active')
    );
    this.tabs.forEach((tab) => this.removeClass(tab, 'active'));
    this.addClass(this.tabLinks[index], 'active')
      .addClass(this.tabLinks[index].tabLink, 'active')
      .addClass(this.tabs[index], 'active');
  }

  destroy() {
    const state = super.destroy() || {};
    state.currentTab = this.currentTab;
    return state;
  }

  /**
   * Make sure to include the tab on the component as it is added.
   *
   * @param component
   * @param element
   * @param data
   * @param before
   * @return {BaseComponent}
   */
  addComponent(component, element, data, before, noAdd, state) {
    component.tab = this.currentTab;
    return super.addComponent(component, element, data, before, noAdd, state);
  }

  /**
   * Only add the components for the active tab.
   */
  addComponents(element, data, options, state) {
    const { currentTab } = state && state.currentTab ? state : this;
    this.setTab(currentTab, state);

    if (!this.options.builder && !this.options.flatten) {
      this.components.forEach(c => c.destroy());
      this.components = [];

      for (let i = 0; i < this.tabs.length; i++) {
        this.empty(this.tabs[i]);

        const tab = this.component.components[i];
        if (!tab || !tab.components) {
          continue;
        }

        const tabComponents = tab.components;

        tabComponents.forEach(component => {
          this.addComponent(component, this.tabs[i], this.data, null, null, state);
        });
      }
    }
  }

  navigateToErroredTab() {
    this.erroredTabs = [];
    this.fillErroredTabs(this.components);
    const erroredTab = this.findNearestTab();
    this.setTab(erroredTab, {});
  }

  fillErroredTabs(components) {
    if (!components) {
      return;
    }
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const tab = this.getComponentTabLocation(this.getKey(comp));
      if (tab !== null && !this.erroredTabs.includes(tab) && comp.error) {
        this.erroredTabs.push(tab);
      }
      this.fillErroredTabs(comp.components);
    }
  }

  getComponentTabLocation(compKey) {
    for (let i = 0; i < this.componentComponents.length; i++) {
      const tab = this.componentComponents[i];
      const found = this.findComponent(tab.components, compKey);
      if (found) {
        return i;
      }
    }
    return null;
  }

  findComponent(components, compKey) {
    if (!components) {
      return false;
    }
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      if (this.getKey(cmp) === compKey || this.findComponent(cmp.components, compKey)) {
        return true;
      }
    }
    return false;
  }

  getKey(comp) {
    return comp.key;
  }

  findNearestTab() {
    if (this.erroredTabs.length === 0 || this.erroredTabs.includes(this.currentTab)) {
      return this.currentTab;
    }

    const greaterThanValues =  this.erroredTabs.filter(n=> n > this.currentTab);
    const lessThanValues =  this.erroredTabs.filter(n=> n < this.currentTab);

    if (greaterThanValues.length === 0) {
      return lessThanValues[lessThanValues.length - 1];
    }
    return greaterThanValues[0];
  }
}


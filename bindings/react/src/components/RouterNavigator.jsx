import React from 'react';
import BasicComponent from './BasicComponent.jsx';
import Util from './Util.js';

/**
 * @original ons-navigator
 * @category navigator
 * @tutorial react/Reference/navigator
 * @description
 * [en] This component is responsible for page transitioning and managing the pages of your OnsenUI application. In order to manage to display the pages, the  navigator needs to define the `renderPage` method, that takes an route and a navigator and  converts it to an page.[/en]
 * [jp] どうしよう[/jp]
 */
class RouterNavigator extends BasicComponent {
  constructor(props) {
    super(props);
    this.cancelUpdate = false;
    this.page = null;
  }

  update(cb) {
    if (!this.cancelUpdate) {
      this.setState({}, cb);
    }
  }

  /**
   * @method resetPageStack
   * @signature resetPageStack(route, options = {})
   * @param {Array} [routes]
   *   [en] The routes that the navigator should be reset to.[/en]
   *   [ja] どうしよう [/ja]
   * @return {Promise}
   *   [en]Promise which resolves to the revealed page.[/en]
   *   [ja]明らかにしたページを解決するPromiseを返します。[/ja]
   * @description
   *   [en] Resets the navigator to the current page stack[/en]
   *   [ja] どうしよう[/ja]
   */
  resetPageStack(routes, options = {}) {
    if (this.isRunning()) {
      return;
    }

    const update = () => {
      return new Promise(resolve => {
        this.pages.push(this.props.renderPage(routes[routes.length - 1]));
        this.update(resolve);
      });
    };

    return this._navi._pushPage(options, update)
      .then(() => {
        this.pages = routes.map(route => this.props.renderPage(route));
        this.update();
      });
  }

  /**
   * @method pushPage
   * @signature pushPage(route, options = {})
   * @param {Array} [routes]
   *   [en] The routes that the navigator should push to.[/en]
   *   [ja] どうしよう [/ja]
   * @return {Promise}
   *   [en] Promise which resolves to the revealed page.[/en]
   *   [ja] 明らかにしたページを解決するPromiseを返します。[/ja]
   * @description
   *   [en] Pushes a page to the page stack[/en]
   *   [ja] どうしよう[/ja]
   */
  pushPage(route, options = {}) {
    if (this.isRunning()) {
      return;
    }

    const update = () => {
      return new Promise(resolve => {
        this.page = this.props.renderPage(route);
        this.update(resolve);
      });
    };

    return this._navi._pushPage(options, update)
      .then(() => {
        this.page = null;
        this.update();
      });
  }

  isRunning() {
    return this._navi._isRunning;
  }

  /*
   * @method replacePage
   * @signature replacePage(page, [options])
   * @return {Promise}
   *   [en]Promise which resolves to the new page.[/en]
   *   [ja]新しいページを解決するPromiseを返します。[/ja]
   * @description
   *   [en]Replaces the current top page with the specified one. Extends `pushPage()` parameters.[/en]
   *   [ja]現在表示中のページをを指定したページに置き換えます。[/ja]
   */
  replacePage(route, options = {}) {
    if (this.isRunning()) {
      return;
    }

    const update = () => {
      return new Promise(resolve => {
        this.pages.push(this.props.renderPage(route));
        this.update(resolve);
      });
    };

    return this._navi._pushPage(options, update)
      .then(() => {
        this.pages.splice(this.pages.length - 2, 1);
        this.update();
      });
  }

  /**
   * @method popPage
   * @signature popPage(route, options = {})
   * @return {Promise}
   *   [en] Promise which resolves to the revealed page.[/en]
   *   [ja] 明らかにしたページを解決するPromiseを返します。[/ja]
   * @description
   *   [en] Pops a page out of the page stack[/en]
   *   [ja] どうしよう[/ja]
   */
  popPage(options = {}) {
    if (this.isRunning()) {
      return;
    }

    const update = () => {
      return new Promise(resolve => {
        this.pages.pop();
        this.update(resolve);
      });
    };

    return this._navi._popPage(options, update);
  }

  componentDidMount() {
    const node = this._navi;

    this.cancelUpdate = false;

    node.addEventListener('prepush', this.props.onPrePush);
    node.addEventListener('postpush', this.props.onPostPush);
    node.addEventListener('prepop', this.props.onPrePop);
    node.addEventListener('postpop', this.props.onPostPop);

    if (!this.props.routeConfig) {
      throw new Error('In RouterNavigator the property routeConfig needs to be set');
    }

    this.routeConfig = this.props.routeConfig;

    this.pages = this.routeConfig.routeStack.map(
      (route) => this.props.renderPage(route, this)
    );

    this.update();
  }

  componentWillReceiveProps(nextProps) {
    const processStack = [...nextProps.routeConfig.processStack];

    /**
     * Fix for Redux Timetravel.
     */
    if (this.props.routeConfig.processStack.length < nextProps.routeConfig.processStack.length &&
      this.props.routeConfig.routeStack.length > nextProps.routeConfig.routeStack.length) {
      return;
    }

    if (processStack.length > 0) {
      const {type, route, options} = processStack[0];

      switch (type) {
        case 'push':
          this.pushPage(route, options);
          break;
        case 'pop':
          this.popPage(options);
          break;
        case 'reset':
          if (Array.isArray(route)) {
            this.resetPageStack(route, options);
          } else {
            this.resetPageStack([route], options);
          }
          break;
        case 'replace':
          this.replacePage(route, options);
          break;
        default:
          throw new Error(`Unknown type ${type} in processStack`);
      }
    }
  }

  componentWillUnmount() {
    const node = this._navi;
    node.removeEventListener('prepush', this.props.onPrePush);
    node.removeEventListener('postpush', this.props.onPostPush);
    node.removeEventListener('prepop', this.props.onPrePop);
    node.removeEventListener('postpop', this.props.onPostPop);
    this.cancelUpdate = true;
  }

  render() {
    var {...others} = this.props;
    Util.convert(others, 'animationOptions', {fun: Util.animationOptionsConverter, newName: 'animation-options'});

    return (
      <ons-navigator {...others} ref={(navi) => { this._navi = navi; }}>
        {this.props.routeConfig.routeStack.map(route => this.props.renderPage(route))}
        {this.page}
      </ons-navigator>
    );
  }
}

Navigator.propTypes = {
  /**
   * @name renderPage
   * @type function
   * @required true
   * @defaultValue null
   * @description
   *  [en] This function takes the current route object as a parameter and  creates returns a react componen.[/en]
   *  [jp] どうしよう[/jp]
   */
  renderPage: React.PropTypes.func.isRequired,
  /**
   * @name initialRouteStack
   * @type array
   * @required false
   * @defaultValue null
   * @description
   *  [en] This array contains the initial routes from the navigator,
   *  which will be used to render the initial pages in the renderPage method.
   *  [/en]
   *  [jp] どうしよう[/jp]
   */
  initialRouteStack: React.PropTypes.array,

  /**
   * @name initialRoute
   * @type object
   * @required false
   * @defaultValue null
   * @description
   *  [en] This array contains the initial route of the navigator,
   *  which will be used to render the initial pages in the
   *  renderPage method.
   *  [/en]
   *  [jp] どうしよう[/jp]
   */
  initialRoute: React.PropTypes.object,

  /**
   * @name onPrePush
   * @type function
   * @required false
   * @description
   *  [en]Called just before a page is pushed.[/en]
   */
  onPrePush: React.PropTypes.func,

  /**
   * @name onPostPush
   * @type function
   * @required false
   * @description
   *  [en]Called just after a page is pushed.[/en]
   */
  onPostPush: React.PropTypes.func,

  /**
   * @name onPrePop
   * @type function
   * @required false
   * @description
   *  [en]Called just before a page is popped.[/en]
   */
  onPrePop: React.PropTypes.func,

  /**
   * @name onPostPop
   * @type function
   * @required false
   * @description
   *  [en]Called just after a page is popped.[/en]
   */
  onPostPop: React.PropTypes.func,

  /**
   * @property animation
   * @type {String}
   * @description
   *   [en]
   *     Animation name. Available animations are `"slide"`, `"lift"`, `"fade"` and `"none"`.
   *     These are platform based animations. For fixed animations, add `"-ios"` or `"-md"` suffix to the animation name. E.g. `"lift-ios"`, `"lift-md"`. Defaults values are `"slide-ios"` and `"fade-md"`.
   *   [/en]
   */
  animation: React.PropTypes.string,

  /**
   * @name animationOptions
   * @type object
   * @description
   *  [en]Specify the animation's duration, delay and timing. E.g.  `{duration: 0.2, delay: 0.4, timing: 'ease-in'}`.[/en]
   *  [jp] [/jp]
   */
  animationOptions: React.PropTypes.object
};

export default RouterNavigator;

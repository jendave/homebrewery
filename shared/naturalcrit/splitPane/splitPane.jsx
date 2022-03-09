require('./splitPane.less');
const React = require('react');
const createClass = require('create-react-class');
const _ = require('lodash');
const cx = require('classnames');

const SplitPane = createClass({
	displayName     : 'SplitPane',
	getDefaultProps : function() {
		return {
			storageKey   : 'naturalcrit-pane-split',
			onDragFinish : function(){} //fires when dragging
		};
	},

	getInitialState : function() {
		return {
			size        : null,
			screenWidth : 0,
			isDragging  : false
		};
	},

	componentDidMount : function() {
		const paneSize = window.localStorage.getItem(this.props.storageKey);
		if(paneSize){
			this.setState({
				size        : paneSize,
				screenWidth : window.innerWidth
			});
		}
		window.addEventListener('resize', this.changeSize);
	},

	componentWillUnmount : function() {
		window.removeEventListener('resize', this.changeSize);
	},

	changeSize : function() {
		const oldWidth = this.state.screenWidth;
		const oldLoc = this.state.size;
		const newLoc = this.limitPosition(window.innerWidth * (oldLoc / oldWidth));
		this.setState({
			size        : newLoc,
			screenWidth : window.innerWidth
		});
	},

	limitPosition : function(x) {
		const minWidth = 1;
		const maxWidth = window.innerWidth - 13;
		const result = Math.min(maxWidth, Math.max(minWidth, x));
		return result;
	},

	handleUp : function(){
		if(this.state.isDragging){
			this.props.onDragFinish(this.state.size);
			window.localStorage.setItem(this.props.storageKey, this.state.size);
		}
		this.setState({ isDragging: false });
	},

	handleDown : function(){
		this.setState({ isDragging: true });
		//this.unFocus()
	},

	handleMove : function(e){
		if(!this.state.isDragging) return;

		const newSize = this.limitPosition(e.pageX);
		this.setState({
			size : newSize
		});
	},
	/*
	unFocus : function() {
		if(document.selection){
				document.selection.empty();
		}else{
			window.getSelection().removeAllRanges();
		}
	},
*/
	renderDivider : function(){
		return <div className='divider' onMouseDown={this.handleDown} >
			<div className='dots'>
				<i className='fas fa-circle' />
				<i className='fas fa-circle' />
				<i className='fas fa-circle' />
			</div>
		</div>;
	},

	render : function(){
		return <div className='splitPane' onMouseMove={this.handleMove} onMouseUp={this.handleUp}>
			<Pane ref='pane1' width={this.state.size}>{this.props.children[0]}</Pane>
			{this.renderDivider()}
			<Pane ref='pane2' isDragging={this.state.isDragging}>{this.props.children[1]}</Pane>
		</div>;
	}
});

const Pane = createClass({
	displayName     : 'Pane',
	getDefaultProps : function() {
		return {
			width : null
		};
	},
	render : function(){
		let styles = {};
		if(this.props.width){
			styles = {
				flex  : 'none',
				width : `${this.props.width}px`
			};
		} else {
			styles = {
				pointerEvents : this.props.isDragging ? 'none' : 'auto' //Disable mouse capture in the rightmost pane; dragging into the iframe drops the divider otherwise
			};
		}

		return <div className={cx('pane', this.props.className)} style={styles}>
			{this.props.children}
		</div>;
	}
});

module.exports = SplitPane;

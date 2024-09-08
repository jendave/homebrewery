const _ = require('lodash');
const dedent = require('dedent-tabs').default;

const res = [];

const pageMap = [];

const walkPages = (iframeDocument)=>{
	let current = 0;
	let skip = 0;
	let reset = 0;
	const pages = iframeDocument.querySelectorAll('.page');
	_.each(pages, (page)=>{
		let showPage = true;
		current++;
		const doSkip = (page.querySelector('.skipCounting'));
		const doReset = (page.querySelector('.resetCounting'));
		if(doReset) {
			reset = current - 1;
			skip = 0;
		} else if(doSkip){
			skip += 1;
			showPage = false;
		}
		pageMap[current] = {
			pageNumber : current - reset - skip,
			showPage   : showPage
		};
	});
};

const recursiveAdd = (title, page, actualPage, targetDepth, child, curDepth=0)=>{
	const anchor = `p${actualPage}`;
	if(curDepth > 5) return; // Something went wrong.
	if(curDepth == targetDepth) {
		child.push({
			title    : title,
			page     : page,
			anchor   : anchor,
			children : []
		});
	} else {
		if(child.length == 0) {
			child.push({
				title    : null,
				page     : page,
				anchor   : anchor,
				children : []
			});
		}
		recursiveAdd(title, page, anchor, targetDepth, _.last(child).children, curDepth+1,);
	}
};


const getTOC = ()=>{
	const iframe = document.getElementById('BrewRenderer');
	const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
	const headings = iframeDocument.querySelectorAll('h1, h2, h3, h4, h5, h6');
	const headerDepth = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

	walkPages(iframeDocument);

	_.each(headings, (heading)=>{
		const onPage = parseInt(heading.closest('.page').id?.replace(/^p/, ''));
		const ToCExclude = getComputedStyle(heading).getPropertyValue('--TOC');

		if(ToCExclude != 'exclude') {
			recursiveAdd(heading.textContent.trim(), pageMap[onPage], onPage, headerDepth.indexOf(heading.tagName), res);
		}
	});
	return res;
};


const ToCIterate = (entries, curDepth=0)=>{
	const levelPad = ['- ###', '  - ####', '    - ', '      - ', '        - ', '          - '];
	const toc = [];
	if(entries.title !== null){
		if(entries.page.showPage) toc.push(`${levelPad[curDepth]} [{{ ${entries.title}}}{{ ${entries.page.pageNumber}}}](#${entries.anchor})`);
	}
	if(entries.children.length) {
		_.each(entries.children, (entry, idx)=>{
			const children = ToCIterate(entry, entry.title == null ? curDepth : curDepth+1);
			if(children.length) {
				toc.push(...children);
			}
		});
	}
	return toc.length > 0 ? toc : null;
};

module.exports = function(props){
	const TOC = getTOC();
	const markdown = _.reduce(TOC, (r, g1, idx1)=>{
		r.push(ToCIterate(g1).join('\n'));
		return r;
	}, []).join('\n');

	return dedent`
		{{toc,wide
		# Contents

		${markdown}
		}}
		\n`;
};

/* global React:true */

function configure() {
  var { hljs, marked } = window;

  marked.setOptions({
    highlight: function (code) {
      return hljs.highlightAuto(code).value;
    }
  });
}

function generateSorter(key) {
  return function(a, b) {
    if (a[key] > b[key]) {
      return 1;
    }
    else if (a[key] < b[key]) {
      return -1;
    }
    else {
      return 0;
    }
  };
}

function prepareDatabase(database) {
  var sortById = generateSorter('id');

  function inferTitle(file, parseFromContent) {
    var path;

    if (parseFromContent) {
      return file.content.split("\n")[0]
        .replace(/#\s+/, '')
        .trim()
        .replace(/^`|`$/g, '')
      ;
    }
    else {
      path = file.id.split('/');
      return path[path.length - 1].replace(/\.md$/, '');
    }
  }

  database.forEach((group) => {
    group.files.sort(sortById);
      console.log(group);

    group.files.forEach((file) => {
      file.title = inferTitle(file, group.config.parse_titles);
    });
  });

  return database;
}

function getActiveEntryPath() {
  var path = window.location.hash.replace(/^#/, '').split('/');

  if (path.length > 1) {
    return {
      group: path[0],
      entry: path.slice(1).join('/')
    };
  }
  else {
    return {
      group: 'YARD-API',
      entry: 'README.md'
    };
  }
}

(function(marked) {
  var delegate;

  var SidebarLink = React.createClass({
    render() {
      var activeContext = getActiveEntryPath();
      var { group, entry } = this.props;
      var isActive = (
        group === activeContext.group &&
        entry === activeContext.entry
      );

      return (
        <a
          className={isActive ? 'active' : null}
          href={'#' + group + '/' + entry}
        >
          {this.props.children}
        </a>
      );
    },

    navigate() {

    }
  });

  var Sidebar = React.createClass({
    getDefaultProps() {
      return {
        groups: []
      };
    },

    render() {
      return (
        <div className="yard-api--sidebar">
          {this.props.groups.map(this.renderGroup)}
        </div>
      );
    },

    renderGroup(group) {
      return (
        <div key={group.id}>
          <h2>{group.id}</h2>

          <ul className="yard-api--sidebar_listing">
            {group.files.map(this.renderEntry.bind(null, group.id))}
          </ul>
        </div>
      );
    },

    renderEntry(groupId, entry) {
      return (
        <li key={entry.id}>
          <SidebarLink group={groupId} entry={entry.id}>{entry.title}</SidebarLink>
        </li>
      );
    }
  });

  var Content = React.createClass({
    render() {
      return (
        <div
          className="yard-api--content"
          dangerouslySetInnerHTML={{__html: marked(this.props.html) }}
        />
      );
    }
  });

  var Root = React.createClass({
    componentDidMount() {
      document.title = this.props.config.title;
      window.addEventListener('hashchange', () => {
        this.forceUpdate();
      });
    },

    render() {
      var activeEntryPath = getActiveEntryPath();
      var activeEntry;
      var activeGroup = this.props.database.filter((group) => {
        return group.id === activeEntryPath.group;
      })[0];

      if (activeGroup) {
        activeEntry = activeGroup.files.filter((entry) => {
          return entry.id === activeEntryPath.entry;
        })[0];
      }

      return (
        <div>
          <Sidebar
            groups={this.props.database}
          />

          {activeEntry && <Content html={activeEntry.content} />}
        </div>
      );
    }
  });

  configure();

  delegate = React.render(
    <Root
      config={window.CONFIG}
      database={prepareDatabase(window.DATABASE)}
    />,
    document.body
  );
}(window.marked));

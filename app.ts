type Store = {
  currentPage: number;
  feeds: NewsFeed[]; //
};

type News = {
  id: number;
  user: string;
  time_ago: string;
  title: string;
  url: string;
  content: string;
};

type NewsFeed = News & {
  comments_count: number;
  points: number;
  read?: boolean; //?를 붙여주면 optional이 됨
};

type NewsDetail = News & {
  comments: NewsComment[];
};

type NewsComment = News & {
  level: number;
  comments: NewsComment[];
};
const root: HTMLElement | null = document.getElementById("root");

const ajax: XMLHttpRequest = new XMLHttpRequest();

const NEWS_URL = "https:/api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = `https:/api.hnpwa.com/v0/item/@id.json`;
const store: Store = {
  currentPage: 1,
  feeds: [],
};

function getData<AjaxResponse>(url: string): AjaxResponse {
  ajax.open("GET", url, false);
  ajax.send(); //데이터를 가져옴

  return JSON.parse(ajax.response);
}

//뉴스피드
function makeFeed(feeds: NewsFeed[]): NewsFeed[] {
  for (let i = 0; i < feeds.length; i++) {
    feeds[i].read = false; //각 글에 read라는 키를 넣고 기본값은 false로
  }
  return feeds;
}

function updateView(html: string): void {
  root ? (root.innerHTML = html) : console.error("root 컨테이너가 없음");
}

function newsFeed(): void {
  let newsFeed: NewsFeed[] = store.feeds;
  const newsList = []; //글 목록 저장 배열

  let templates = `
    <div class="bg-gray-600 mb-10">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="justify-start">
              <div class="font-extrabold text-4xl">Hacker News</div>
            </div>
            <div>
              <a href = "#/page/{{__prev_page__}}"><i class="fas fa-chevron-left"></i></a>
              <a href = "#/page/{{__next_page__}}"><i class="fas fa-chevron-right"></i></a>
            </div>
          </div>
        </div>
      </div>
      <div class="p-5 text-2xl text-gray-700 h-screen">
        <ul class="flex flex-col justify-around h-full">
          {{__news_feed__}}
        </ul>
      </div>
    </div>
  `;

  if (newsFeed.length === 0) {
    console.log("getData");
    newsFeed = store.feeds = makeFeed(getData<NewsFeed[]>(NEWS_URL));
  }

  for (let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
    newsList.push(`
      <li class="border rounded-md p-3 bg-white hover:bg-green-100
      ${newsFeed[i].read === true ? "text-red-700" : "text-black"}">
        <a href = "#/show/${newsFeed[i].id}">
          ${newsFeed[i].title} 
        </a>
        <div class="text-sm">
          posted by ${newsFeed[i].user}, comments (${
      newsFeed[i].comments_count
    })
        </div>
      </li>
    `);
  }
  templates = templates.replace("{{__news_feed__}}", newsList.join(""));
  templates = templates.replace(
    "{{__prev_page__}}",
    String(store.currentPage > 1 ? store.currentPage - 1 : 1)
  );
  templates = templates.replace(
    "{{__next_page__}}",
    String(store.currentPage < 3 ? store.currentPage + 1 : 3)
  );

  updateView(templates);
}

function newsDetail(): void {
  const id = location.hash.substr(7);
  const newsContent = getData<NewsDetail>(CONTENT_URL.replace("@id", id));
  let template = `
    <div class="p-3">
      <div class="flex items-end">
        <div class="text-2xl mr-4">${newsContent.title}</div>
        <a href="#/page/${store.currentPage}">목록으로</a>
      </div>
      <div class="mt-10">
        comments
        <hr class="mb-5">
        {{__comments__}}
      </div>
    </div>
  `;
  for (let i = 0; i < store.feeds.length; i++) {
    if (store.feeds[i].id === Number(id)) {
      store.feeds[i].read = true;
      break;
    }
  }

  template = template.replace(
    "{{__comments__}}",
    makeComments(newsContent.comments)
  );

  updateView(template);
}

function makeComments(comments: NewsComment[]): string {
  const commentString = [];

  for (let i = 0; i < comments.length; i++) {
    const comment: NewsComment = comments[i];

    commentString.push(`
    <div class="ml-${comment.level * 3} mb-2 border p-3">
      <div>
        ${comment.content}
      </div>
      <div>
        - posted by ${comment.user}, ${comment.time_ago} -
      </div>
    </div>
  `);

    if (comment.comments) {
      commentString.push(makeComments(comment.comments));
    }
  }

  return commentString.join("");
}

function router(): void {
  const routePath = location.hash;
  console.log("hash changed");

  if (routePath === "") {
    newsFeed();
  } else if (routePath.indexOf("#/page/") >= 0) {
    store.currentPage = Number(routePath.substr(7));
    newsFeed();
  } else {
    newsDetail();
  }
}
window.addEventListener("hashchange", router);

router();

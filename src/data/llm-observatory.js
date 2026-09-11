// src/data/llm-observatory.js
//
// The model set behind the LLM Observatory globe. Extracted verbatim from the
// Claude Design canvas export this page replaced, so the plotted layout is
// unchanged: `jlat`/`jlon` are the original per-model jitter, derived from each
// row's position in the authored array and baked in here rather than recomputed,
// because the renderer now sorts chronologically on load.
//
// Sizes are parameter counts in billions and, for closed models, best public
// estimates. `score` is a 0-100 capability placement, not a benchmark result.

export const CITIES = {
  "sf": {
    "n": "San Francisco",
    "c": "USA",
    "lat": 37.77,
    "lon": -122.42
  },
  "mv": {
    "n": "Mountain View",
    "c": "USA",
    "lat": 37.39,
    "lon": -122.08
  },
  "mp": {
    "n": "Menlo Park",
    "c": "USA",
    "lat": 37.45,
    "lon": -122.18
  },
  "rd": {
    "n": "Redmond",
    "c": "USA",
    "lat": 47.67,
    "lon": -122.12
  },
  "ln": {
    "n": "London",
    "c": "UK",
    "lat": 51.51,
    "lon": -0.13
  },
  "pa": {
    "n": "Paris",
    "c": "France",
    "lat": 48.85,
    "lon": 2.35
  },
  "tlv": {
    "n": "Tel Aviv",
    "c": "Israel",
    "lat": 32.08,
    "lon": 34.78
  },
  "ad": {
    "n": "Abu Dhabi",
    "c": "UAE",
    "lat": 24.45,
    "lon": 54.38
  },
  "bj": {
    "n": "Beijing",
    "c": "China",
    "lat": 39.9,
    "lon": 116.4
  },
  "hz": {
    "n": "Hangzhou",
    "c": "China",
    "lat": 30.27,
    "lon": 120.15
  },
  "bos": {
    "n": "Boston",
    "c": "USA",
    "lat": 42.36,
    "lon": -71.06
  },
  "sc": {
    "n": "Santa Clara",
    "c": "USA",
    "lat": 37.35,
    "lon": -121.95
  },
  "sea": {
    "n": "Seattle",
    "c": "USA",
    "lat": 47.61,
    "lon": -122.33
  },
  "tor": {
    "n": "Toronto",
    "c": "Canada",
    "lat": 43.65,
    "lon": -79.38
  },
  "ny": {
    "n": "New York",
    "c": "USA",
    "lat": 40.71,
    "lon": -74
  },
  "sz": {
    "n": "Shenzhen",
    "c": "China",
    "lat": 22.54,
    "lon": 114.06
  },
  "sh": {
    "n": "Shanghai",
    "c": "China",
    "lat": 31.23,
    "lon": 121.47
  },
  "dg": {
    "n": "Donegal",
    "c": "Ireland",
    "lat": 54.9,
    "lon": -8
  },
  "dub": {
    "n": "Dublin",
    "c": "Ireland",
    "lat": 53.35,
    "lon": -6.26
  }
};

export const ORGS = {
  "openai": {
    "label": "OpenAI"
  },
  "anthropic": {
    "label": "Anthropic"
  },
  "google": {
    "label": "Google DeepMind"
  },
  "meta": {
    "label": "Meta"
  },
  "microsoft": {
    "label": "Microsoft"
  },
  "mistral": {
    "label": "Mistral"
  },
  "xai": {
    "label": "xAI"
  },
  "alibaba": {
    "label": "Alibaba · Qwen"
  },
  "deepseek": {
    "label": "DeepSeek"
  },
  "cn": {
    "label": "China · other"
  },
  "west": {
    "label": "Independent"
  },
  "foxxe": {
    "label": "Foxxe AI · Ireland"
  },
  "adapt": {
    "label": "ADAPT · DCU"
  }
};

// One hue per maker, per theme. The globe resolves these against the resolved
// site theme rather than carrying its own palette.
export const MAKER_HUES = {
  "dark": {
    "openai": "#1fd498",
    "anthropic": "#e08a5b",
    "google": "#5b8cff",
    "meta": "#8a7cff",
    "microsoft": "#36c5d0",
    "mistral": "#ff8a3d",
    "xai": "#dfe6ff",
    "alibaba": "#b76cff",
    "deepseek": "#6d78ff",
    "cn": "#ff6b6b",
    "west": "#ffce4a",
    "foxxe": "#ff5ea8",
    "adapt": "#8fe04a"
  },
  "light": {
    "openai": "#0c8a63",
    "anthropic": "#a85a2c",
    "google": "#2b57c4",
    "meta": "#5b41c2",
    "microsoft": "#0f7284",
    "mistral": "#c2560f",
    "xai": "#4a5570",
    "alibaba": "#7a30bd",
    "deepseek": "#3944c2",
    "cn": "#c2372f",
    "west": "#9a7200",
    "foxxe": "#bd2f71",
    "adapt": "#468a12"
  },
  "editorial": {
    "openai": "#0c8a63",
    "anthropic": "#a85a2c",
    "google": "#2b57c4",
    "meta": "#5b41c2",
    "microsoft": "#0f7284",
    "mistral": "#c2560f",
    "xai": "#4a5570",
    "alibaba": "#7a30bd",
    "deepseek": "#3944c2",
    "cn": "#c2372f",
    "west": "#9a7200",
    "foxxe": "#bd2f71",
    "adapt": "#468a12"
  }
};

export const MODELS = [
  {"date":"2017-06","name":"Transformer","lab":"Google Brain","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":0.065,"score":34,"open":true,"t":1497484800000,"jlat":-1,"jlon":-1.2},
  {"date":"2018-06","name":"GPT-1","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":0.117,"score":38,"open":true,"t":1529020800000,"jlat":-0.2727272727272727,"jlon":-1.0153846153846153},
  {"date":"2018-10","name":"BERT","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":0.34,"score":45,"open":true,"t":1539561600000,"jlat":0.4545454545454546,"jlon":-0.8307692307692307},
  {"date":"2019-02","name":"GPT-2","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1.5,"score":50,"open":true,"t":1550188800000,"jlat":-0.8181818181818181,"jlon":-0.6461538461538461},
  {"date":"2019-07","name":"RoBERTa","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":0.355,"score":48,"open":true,"t":1563148800000,"jlat":-0.09090909090909094,"jlon":-0.46153846153846145},
  {"date":"2019-10","name":"T5","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":11,"score":55,"open":true,"t":1571097600000,"jlat":0.6363636363636365,"jlon":-0.2769230769230769},
  {"date":"2020-05","name":"GPT-3","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":175,"score":60,"open":false,"t":1589500800000,"jlat":-0.6363636363636364,"jlon":-0.09230769230769224},
  {"date":"2021-05","name":"Wu Dao 2.0","lab":"BAAI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":1750,"score":52,"open":false,"t":1621036800000,"jlat":0.09090909090909083,"jlon":0.09230769230769224},
  {"date":"2021-08","name":"Jurassic-1","lab":"AI21 Labs","org":"west","city":"tlv","cityName":"Tel Aviv","country":"Israel","lat":32.08,"lon":34.78,"params":178,"score":58,"open":false,"t":1628985600000,"jlat":0.8181818181818181,"jlon":0.276923076923077},
  {"date":"2021-10","name":"MT-NLG","lab":"Microsoft · NVIDIA","org":"microsoft","city":"rd","cityName":"Redmond","country":"USA","lat":47.67,"lon":-122.12,"params":530,"score":61,"open":false,"t":1634256000000,"jlat":-0.4545454545454546,"jlon":0.46153846153846145},
  {"date":"2021-10","name":"Irish GPT-2","lab":"ADAPT · DCU","org":"adapt","city":"dub","cityName":"Dublin","country":"Ireland","lat":53.35,"lon":-6.26,"params":0.124,"score":40,"open":true,"t":1634256000000,"jlat":0.8181818181818181,"jlon":1.0153846153846156},
  {"date":"2021-12","name":"Gopher","lab":"DeepMind","org":"google","city":"ln","cityName":"London","country":"UK","lat":51.51,"lon":-0.13,"params":280,"score":63,"open":false,"t":1639526400000,"jlat":0.2727272727272727,"jlon":0.6461538461538462},
  {"date":"2022-03","name":"Chinchilla","lab":"DeepMind","org":"google","city":"ln","cityName":"London","country":"UK","lat":51.51,"lon":-0.13,"params":70,"score":67,"open":false,"t":1647302400000,"jlat":-1,"jlon":0.8307692307692307},
  {"date":"2022-03","name":"gaBERT","lab":"ADAPT · DCU","org":"adapt","city":"dub","cityName":"Dublin","country":"Ireland","lat":53.35,"lon":-6.26,"params":0.11,"score":42,"open":true,"t":1647302400000,"jlat":-0.4545454545454546,"jlon":-1.2},
  {"date":"2022-03","name":"gaELECTRA","lab":"ADAPT · DCU","org":"adapt","city":"dub","cityName":"Dublin","country":"Ireland","lat":53.35,"lon":-6.26,"params":0.11,"score":41,"open":true,"t":1647302400000,"jlat":0.2727272727272727,"jlon":-1.0153846153846153},
  {"date":"2022-04","name":"PaLM","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":540,"score":69,"open":false,"t":1649980800000,"jlat":-0.2727272727272727,"jlon":1.0153846153846156},
  {"date":"2022-05","name":"OPT-175B","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":175,"score":61,"open":true,"t":1652572800000,"jlat":0.4545454545454546,"jlon":-1.2},
  {"date":"2022-07","name":"BLOOM","lab":"BigScience","org":"west","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":176,"score":60,"open":true,"t":1657843200000,"jlat":-0.8181818181818181,"jlon":-1.0153846153846153},
  {"date":"2022-08","name":"GLM-130B","lab":"Tsinghua · Zhipu","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":130,"score":63,"open":true,"t":1660521600000,"jlat":-0.09090909090909094,"jlon":-0.8307692307692307},
  {"date":"2022-11","name":"ChatGPT","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":175,"score":70,"open":false,"t":1668470400000,"jlat":0.6363636363636365,"jlon":-0.6461538461538461},
  {"date":"2023-02","name":"LLaMA","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":65,"score":68,"open":true,"t":1676419200000,"jlat":-0.6363636363636364,"jlon":-0.46153846153846145},
  {"date":"2023-03","name":"GPT-4","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1760,"score":86,"open":false,"t":1678838400000,"jlat":0.09090909090909083,"jlon":-0.2769230769230769},
  {"date":"2023-03","name":"Claude","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":100,"score":77,"open":false,"t":1678838400000,"jlat":0.8181818181818181,"jlon":-0.09230769230769224},
  {"date":"2023-04","name":"Dolly 2.0","lab":"Databricks","org":"west","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":12,"score":50,"open":true,"t":1681516800000,"jlat":-1,"jlon":1.0153846153846156},
  {"date":"2023-05","name":"PaLM 2","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":340,"score":81,"open":false,"t":1684108800000,"jlat":-0.4545454545454546,"jlon":0.09230769230769224},
  {"date":"2023-05","name":"StarCoder","lab":"BigCode · HF","org":"west","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":15,"score":55,"open":true,"t":1684108800000,"jlat":-0.2727272727272727,"jlon":-1.2},
  {"date":"2023-05","name":"MPT-7B","lab":"MosaicML","org":"west","city":"bos","cityName":"Boston","country":"USA","lat":42.36,"lon":-71.06,"params":7,"score":55,"open":true,"t":1684108800000,"jlat":0.4545454545454546,"jlon":-1.0153846153846153},
  {"date":"2023-06","name":"Falcon-40B","lab":"TII","org":"west","city":"ad","cityName":"Abu Dhabi","country":"UAE","lat":24.45,"lon":54.38,"params":40,"score":62,"open":true,"t":1686787200000,"jlat":-0.8181818181818181,"jlon":-0.8307692307692307},
  {"date":"2023-07","name":"Llama 2","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":70,"score":74,"open":true,"t":1689379200000,"jlat":0.2727272727272727,"jlon":0.276923076923077},
  {"date":"2023-07","name":"Claude 2","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":130,"score":80,"open":false,"t":1689379200000,"jlat":-1,"jlon":0.46153846153846145},
  {"date":"2023-09","name":"Mistral 7B","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":7.3,"score":71,"open":true,"t":1694736000000,"jlat":-0.2727272727272727,"jlon":0.6461538461538462},
  {"date":"2023-09","name":"Falcon 180B","lab":"TII","org":"west","city":"ad","cityName":"Abu Dhabi","country":"UAE","lat":24.45,"lon":54.38,"params":180,"score":70,"open":true,"t":1694736000000,"jlat":0.4545454545454546,"jlon":0.8307692307692307},
  {"date":"2023-09","name":"Qwen","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":14,"score":72,"open":true,"t":1694736000000,"jlat":-0.8181818181818181,"jlon":1.0153846153846156},
  {"date":"2023-10","name":"Zephyr-7B","lab":"Hugging Face","org":"west","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":7,"score":67,"open":true,"t":1697328000000,"jlat":-0.09090909090909094,"jlon":-0.6461538461538461},
  {"date":"2023-11","name":"Grok-1","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":314,"score":73,"open":true,"t":1700006400000,"jlat":-0.09090909090909094,"jlon":-1.2},
  {"date":"2023-11","name":"Yi-34B","lab":"01.AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":34,"score":73,"open":true,"t":1700006400000,"jlat":0.6363636363636365,"jlon":-1.0153846153846153},
  {"date":"2023-12","name":"Gemini 1.0","lab":"Google DeepMind","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":1500,"score":84,"open":false,"t":1702598400000,"jlat":-0.6363636363636364,"jlon":-0.8307692307692307},
  {"date":"2023-12","name":"Mixtral 8x7B","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":47,"score":75,"open":true,"t":1702598400000,"jlat":0.09090909090909083,"jlon":-0.6461538461538461},
  {"date":"2023-12","name":"Phi-2","lab":"Microsoft","org":"microsoft","city":"rd","cityName":"Redmond","country":"USA","lat":47.67,"lon":-122.12,"params":2.7,"score":61,"open":true,"t":1702598400000,"jlat":0.6363636363636365,"jlon":-0.46153846153846145},
  {"date":"2024-02","name":"Gemini 1.5 Pro","lab":"Google DeepMind","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":200,"score":85,"open":false,"t":1707955200000,"jlat":0.8181818181818181,"jlon":-0.46153846153846145},
  {"date":"2024-02","name":"Gemma","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":7,"score":64,"open":true,"t":1707955200000,"jlat":-0.6363636363636364,"jlon":-0.2769230769230769},
  {"date":"2024-02","name":"OLMo","lab":"Allen AI","org":"west","city":"sea","cityName":"Seattle","country":"USA","lat":47.61,"lon":-122.33,"params":7,"score":62,"open":true,"t":1707955200000,"jlat":0.09090909090909083,"jlon":-0.09230769230769224},
  {"date":"2024-03","name":"Claude 3 Opus","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":500,"score":87,"open":false,"t":1710460800000,"jlat":-0.4545454545454546,"jlon":-0.2769230769230769},
  {"date":"2024-03","name":"DBRX","lab":"Databricks","org":"west","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":132,"score":74,"open":true,"t":1710460800000,"jlat":0.8181818181818181,"jlon":0.09230769230769224},
  {"date":"2024-04","name":"Llama 3","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":70,"score":82,"open":true,"t":1713139200000,"jlat":0.2727272727272727,"jlon":-0.09230769230769224},
  {"date":"2024-04","name":"Command R+","lab":"Cohere","org":"west","city":"tor","cityName":"Toronto","country":"Canada","lat":43.65,"lon":-79.38,"params":104,"score":76,"open":true,"t":1713139200000,"jlat":-0.4545454545454546,"jlon":0.276923076923077},
  {"date":"2024-04","name":"Mixtral 8x22B","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":141,"score":78,"open":true,"t":1713139200000,"jlat":0.2727272727272727,"jlon":0.46153846153846145},
  {"date":"2024-04","name":"Arctic","lab":"Snowflake","org":"west","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":480,"score":67,"open":true,"t":1713139200000,"jlat":-1,"jlon":0.6461538461538462},
  {"date":"2024-05","name":"GPT-4o","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":200,"score":88,"open":false,"t":1715731200000,"jlat":-1,"jlon":0.09230769230769224},
  {"date":"2024-05","name":"DeepSeek-V2","lab":"DeepSeek","org":"deepseek","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":236,"score":78,"open":true,"t":1715731200000,"jlat":-0.2727272727272727,"jlon":0.276923076923077},
  {"date":"2024-06","name":"Claude 3.5 Sonnet","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":175,"score":89,"open":false,"t":1718409600000,"jlat":0.4545454545454546,"jlon":0.46153846153846145},
  {"date":"2024-06","name":"Qwen2-72B","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":72,"score":84,"open":true,"t":1718409600000,"jlat":-0.8181818181818181,"jlon":0.6461538461538462},
  {"date":"2024-06","name":"Nemotron-4 340B","lab":"NVIDIA","org":"west","city":"sc","cityName":"Santa Clara","country":"USA","lat":37.35,"lon":-121.95,"params":340,"score":80,"open":true,"t":1718409600000,"jlat":-0.2727272727272727,"jlon":0.8307692307692307},
  {"date":"2024-06","name":"Gemma 2","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":27,"score":79,"open":true,"t":1718409600000,"jlat":0.4545454545454546,"jlon":1.0153846153846156},
  {"date":"2024-07","name":"Llama 3.1 405B","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":405,"score":86,"open":true,"t":1721001600000,"jlat":-0.09090909090909094,"jlon":0.8307692307692307},
  {"date":"2024-07","name":"Mistral NeMo","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":12,"score":76,"open":true,"t":1721001600000,"jlat":-0.8181818181818181,"jlon":-1.2},
  {"date":"2024-08","name":"Grok-2","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":314,"score":84,"open":false,"t":1723680000000,"jlat":0.6363636363636365,"jlon":1.0153846153846156},
  {"date":"2024-08","name":"Jamba 1.5","lab":"AI21 Labs","org":"west","city":"tlv","cityName":"Tel Aviv","country":"Israel","lat":32.08,"lon":34.78,"params":398,"score":77,"open":true,"t":1723680000000,"jlat":-0.09090909090909094,"jlon":-1.0153846153846153},
  {"date":"2024-09","name":"o1","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":300,"score":91,"open":false,"t":1726358400000,"jlat":-0.6363636363636364,"jlon":-1.2},
  {"date":"2024-09","name":"Llama 3.2","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":90,"score":81,"open":true,"t":1726358400000,"jlat":0.6363636363636365,"jlon":-0.8307692307692307},
  {"date":"2024-09","name":"Pixtral","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":12,"score":77,"open":true,"t":1726358400000,"jlat":-0.6363636363636364,"jlon":-0.6461538461538461},
  {"date":"2024-10","name":"Granite 3.0","lab":"IBM","org":"west","city":"ny","cityName":"New York","country":"USA","lat":40.71,"lon":-74,"params":8,"score":72,"open":true,"t":1728950400000,"jlat":0.09090909090909083,"jlon":-0.46153846153846145},
  {"date":"2024-11","name":"Qwen2.5","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":72,"score":86,"open":true,"t":1731628800000,"jlat":0.8181818181818181,"jlon":-0.2769230769230769},
  {"date":"2024-12","name":"DeepSeek-V3","lab":"DeepSeek","org":"deepseek","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":671,"score":88,"open":true,"t":1734220800000,"jlat":0.09090909090909083,"jlon":-1.0153846153846153},
  {"date":"2024-12","name":"Llama 3.3","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":70,"score":85,"open":true,"t":1734220800000,"jlat":-0.4545454545454546,"jlon":-0.09230769230769224},
  {"date":"2024-12","name":"Phi-4","lab":"Microsoft","org":"microsoft","city":"rd","cityName":"Redmond","country":"USA","lat":47.67,"lon":-122.12,"params":14,"score":84,"open":true,"t":1734220800000,"jlat":0.2727272727272727,"jlon":0.09230769230769224},
  {"date":"2025-01","name":"DeepSeek-R1","lab":"DeepSeek","org":"deepseek","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":671,"score":90,"open":true,"t":1736899200000,"jlat":0.8181818181818181,"jlon":-0.8307692307692307},
  {"date":"2025-01","name":"MiniMax-01","lab":"MiniMax","org":"cn","city":"sh","cityName":"Shanghai","country":"China","lat":31.23,"lon":121.47,"params":456,"score":85,"open":true,"t":1736899200000,"jlat":-1,"jlon":0.276923076923077},
  {"date":"2025-01","name":"Kimi k1.5","lab":"Moonshot AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":100,"score":86,"open":false,"t":1736899200000,"jlat":-0.2727272727272727,"jlon":0.46153846153846145},
  {"date":"2025-01","name":"InternLM3","lab":"Shanghai AI Lab","org":"cn","city":"sh","cityName":"Shanghai","country":"China","lat":31.23,"lon":121.47,"params":8,"score":80,"open":true,"t":1736899200000,"jlat":0.4545454545454546,"jlon":0.6461538461538462},
  {"date":"2025-02","name":"Claude 3.7 Sonnet","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":250,"score":91,"open":false,"t":1739577600000,"jlat":-0.4545454545454546,"jlon":-0.6461538461538461},
  {"date":"2025-02","name":"Grok-3","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":600,"score":90,"open":false,"t":1739577600000,"jlat":0.2727272727272727,"jlon":-0.46153846153846145},
  {"date":"2025-02","name":"GPT-4.5","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1000,"score":90,"open":false,"t":1739577600000,"jlat":-1,"jlon":-0.2769230769230769},
  {"date":"2025-03","name":"Gemini 2.5 Pro","lab":"Google DeepMind","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":400,"score":92,"open":false,"t":1741996800000,"jlat":-0.2727272727272727,"jlon":-0.09230769230769224},
  {"date":"2025-03","name":"Gemma 3","lab":"Google","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":27,"score":86,"open":true,"t":1741996800000,"jlat":-0.8181818181818181,"jlon":0.8307692307692307},
  {"date":"2025-03","name":"Command A","lab":"Cohere","org":"west","city":"tor","cityName":"Toronto","country":"Canada","lat":43.65,"lon":-79.38,"params":111,"score":87,"open":true,"t":1741996800000,"jlat":-0.09090909090909094,"jlon":1.0153846153846156},
  {"date":"2025-03","name":"OLMo 2","lab":"Allen AI","org":"west","city":"sea","cityName":"Seattle","country":"USA","lat":47.61,"lon":-122.33,"params":32,"score":82,"open":true,"t":1741996800000,"jlat":0.6363636363636365,"jlon":-1.2},
  {"date":"2025-04","name":"Llama 4","lab":"Meta AI","org":"meta","city":"mp","cityName":"Menlo Park","country":"USA","lat":37.45,"lon":-122.18,"params":400,"score":87,"open":true,"t":1744675200000,"jlat":0.4545454545454546,"jlon":0.09230769230769224},
  {"date":"2025-04","name":"Qwen3","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":235,"score":89,"open":true,"t":1744675200000,"jlat":-0.8181818181818181,"jlon":0.276923076923077},
  {"date":"2025-05","name":"Claude Opus 4","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":500,"score":93,"open":false,"t":1747267200000,"jlat":-0.09090909090909094,"jlon":0.46153846153846145},
  {"date":"2025-05","name":"Mistral Medium 3","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":200,"score":88,"open":false,"t":1747267200000,"jlat":-0.6363636363636364,"jlon":-1.0153846153846153},
  {"date":"2025-06","name":"o3","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":500,"score":92,"open":false,"t":1749945600000,"jlat":-0.6363636363636364,"jlon":0.8307692307692307},
  {"date":"2025-07","name":"Grok 4","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":900,"score":92,"open":false,"t":1752537600000,"jlat":0.09090909090909083,"jlon":1.0153846153846156},
  {"date":"2025-07","name":"Kimi K2","lab":"Moonshot AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":1000,"score":90,"open":true,"t":1752537600000,"jlat":0.09090909090909083,"jlon":-0.8307692307692307},
  {"date":"2025-08","name":"Claude Opus 4.1","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":550,"score":93,"open":false,"t":1755216000000,"jlat":0.6363636363636365,"jlon":0.6461538461538462},
  {"date":"2025-08","name":"GPT-5","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1500,"score":93,"open":false,"t":1755216000000,"jlat":0.8181818181818181,"jlon":-1.2},
  {"date":"2025-08","name":"GLM-4.5","lab":"Zhipu AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":355,"score":89,"open":true,"t":1755216000000,"jlat":0.8181818181818181,"jlon":-0.6461538461538461},
  {"date":"2025-08","name":"toddric zephyr-7B","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":7.24,"score":62,"open":false,"t":1755216000000,"jlat":-0.6363636363636364,"jlon":1.0153846153846156},
  {"date":"2025-08","name":"toddric zephyr-7B LoRA","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":7.24,"score":61,"open":false,"t":1755216000000,"jlat":0.09090909090909083,"jlon":-1.2},
  {"date":"2025-08","name":"toddric 20B SFT","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":20,"score":65,"open":false,"t":1755216000000,"jlat":0.8181818181818181,"jlon":-1.0153846153846153},
  {"date":"2025-08","name":"toddric 3B v0","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":3.09,"score":58,"open":false,"t":1755216000000,"jlat":-0.4545454545454546,"jlon":-0.8307692307692307},
  {"date":"2025-08","name":"toddric 3B v3","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":3.09,"score":58,"open":false,"t":1755216000000,"jlat":0.2727272727272727,"jlon":-0.6461538461538461},
  {"date":"2025-08","name":"toddric 3B v3 (4-bit)","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":3.17,"score":57,"open":false,"t":1755216000000,"jlat":-1,"jlon":-0.46153846153846145},
  {"date":"2025-09","name":"Qwen3-Max","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":1000,"score":90,"open":false,"t":1757894400000,"jlat":-0.4545454545454546,"jlon":-1.0153846153846153},
  {"date":"2025-09","name":"DeepSeek-V3.2","lab":"DeepSeek","org":"deepseek","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":685,"score":90,"open":true,"t":1757894400000,"jlat":0.2727272727272727,"jlon":-0.8307692307692307},
  {"date":"2025-09","name":"toddric 1.5B","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":1.54,"score":52,"open":false,"t":1757894400000,"jlat":-0.2727272727272727,"jlon":-0.2769230769230769},
  {"date":"2025-09","name":"toddric 1.5B LoRA","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":1.5,"score":51,"open":false,"t":1757894400000,"jlat":0.4545454545454546,"jlon":-0.09230769230769224},
  {"date":"2025-10","name":"Claude Sonnet 4.5","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":300,"score":93,"open":false,"t":1760486400000,"jlat":-1,"jlon":-0.6461538461538461},
  {"date":"2025-10","name":"toddric 8B v1","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":8.03,"score":66,"open":true,"t":1760486400000,"jlat":-0.8181818181818181,"jlon":0.09230769230769224},
  {"date":"2025-10","name":"toddric v2 (DPO)","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":8.03,"score":68,"open":true,"t":1760486400000,"jlat":-0.09090909090909094,"jlon":0.276923076923077},
  {"date":"2025-11","name":"GPT-5.1","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1500,"score":94,"open":false,"t":1763164800000,"jlat":-0.2727272727272727,"jlon":-0.46153846153846145},
  {"date":"2025-11","name":"Gemini 3 Pro","lab":"Google DeepMind","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":1200,"score":95,"open":false,"t":1763164800000,"jlat":0.4545454545454546,"jlon":-0.2769230769230769},
  {"date":"2025-11","name":"Claude Opus 4.5","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":800,"score":95,"open":false,"t":1763164800000,"jlat":-0.8181818181818181,"jlon":-0.09230769230769224},
  {"date":"2025-11","name":"MiniMax M2","lab":"MiniMax","org":"cn","city":"sh","cityName":"Shanghai","country":"China","lat":31.23,"lon":121.47,"params":230,"score":90,"open":true,"t":1763164800000,"jlat":-0.4545454545454546,"jlon":-0.46153846153846145},
  {"date":"2025-12","name":"Mistral Large 3","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":675,"score":89,"open":true,"t":1765756800000,"jlat":0.6363636363636365,"jlon":0.276923076923077},
  {"date":"2025-12","name":"GPT-5.2","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1600,"score":95,"open":false,"t":1765756800000,"jlat":-0.6363636363636364,"jlon":0.46153846153846145},
  {"date":"2025-12","name":"GLM-4.6","lab":"Zhipu AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":357,"score":91,"open":true,"t":1765756800000,"jlat":0.2727272727272727,"jlon":-0.2769230769230769},
  {"date":"2026-02","name":"Claude Opus 4.6","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":850,"score":96,"open":false,"t":1771113600000,"jlat":-0.09090909090909094,"jlon":0.09230769230769224},
  {"date":"2026-02","name":"Gemini 3.1 Pro","lab":"Google DeepMind","org":"google","city":"mv","cityName":"Mountain View","country":"USA","lat":37.39,"lon":-122.08,"params":1300,"score":96,"open":false,"t":1771113600000,"jlat":0.09090909090909083,"jlon":0.6461538461538462},
  {"date":"2026-03","name":"GPT-5.4","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1600,"score":95,"open":false,"t":1773532800000,"jlat":0.8181818181818181,"jlon":0.8307692307692307},
  {"date":"2026-04","name":"DeepSeek-V4","lab":"DeepSeek","org":"deepseek","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":1200,"score":93,"open":true,"t":1776211200000,"jlat":-0.4545454545454546,"jlon":1.0153846153846156},
  {"date":"2026-04","name":"Qwen3.6-Max","lab":"Alibaba","org":"alibaba","city":"hz","cityName":"Hangzhou","country":"China","lat":30.27,"lon":120.15,"params":1100,"score":93,"open":false,"t":1776211200000,"jlat":0.2727272727272727,"jlon":-1.2},
  {"date":"2026-04","name":"Claude Opus 4.7","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":900,"score":96,"open":false,"t":1776211200000,"jlat":-1,"jlon":-1.0153846153846153},
  {"date":"2026-05","name":"Claude Opus 4.8","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":950,"score":97,"open":false,"t":1778803200000,"jlat":-0.2727272727272727,"jlon":-0.8307692307692307},
  {"date":"2026-05","name":"Grok 4.2","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1000,"score":94,"open":false,"t":1778803200000,"jlat":0.4545454545454546,"jlon":-0.6461538461538461},
  {"date":"2026-06","name":"GPT-5.5","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1700,"score":96,"open":false,"t":1781481600000,"jlat":-0.8181818181818181,"jlon":-0.46153846153846145},
  {"date":"2026-06","name":"Claude Fable 5","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1000,"score":97,"open":false,"t":1781481600000,"jlat":-0.09090909090909094,"jlon":-0.2769230769230769},
  {"date":"2026-06","name":"Claude Sonnet 5","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":350,"score":95,"open":false,"t":1781481600000,"jlat":0.6363636363636365,"jlon":-0.09230769230769224},
  {"date":"2026-06","name":"GLM-5.2","lab":"Zhipu AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":400,"score":92,"open":true,"t":1781481600000,"jlat":-1,"jlon":-0.09230769230769224},
  {"date":"2026-06","name":"Nemotron 3 Ultra","lab":"NVIDIA","org":"west","city":"sc","cityName":"Santa Clara","country":"USA","lat":37.35,"lon":-121.95,"params":550,"score":91,"open":true,"t":1781481600000,"jlat":-0.2727272727272727,"jlon":0.09230769230769224},
  {"date":"2026-06","name":"MiniMax M3","lab":"MiniMax","org":"cn","city":"sh","cityName":"Shanghai","country":"China","lat":31.23,"lon":121.47,"params":250,"score":91,"open":true,"t":1781481600000,"jlat":0.4545454545454546,"jlon":0.276923076923077},
  {"date":"2026-06","name":"macalla-v1","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":8.19,"score":72,"open":false,"t":1781481600000,"jlat":0.6363636363636365,"jlon":0.46153846153846145},
  {"date":"2026-06","name":"macalla-v2","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":8.19,"score":72,"open":false,"t":1781481600000,"jlat":-0.6363636363636364,"jlon":0.6461538461538462},
  {"date":"2026-07","name":"GPT-5.6","lab":"OpenAI","org":"openai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1800,"score":97,"open":false,"t":1784073600000,"jlat":-0.6363636363636364,"jlon":0.09230769230769224},
  {"date":"2026-07","name":"Grok 4.5","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1500,"score":95,"open":false,"t":1784073600000,"jlat":0.09090909090909083,"jlon":0.276923076923077},
  {"date":"2026-07","name":"Claude Opus 5","lab":"Anthropic","org":"anthropic","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1000,"score":98,"open":false,"t":1784073600000,"jlat":0.8181818181818181,"jlon":0.46153846153846145},
  {"date":"2026-07","name":"Mistral Medium 3.5","lab":"Mistral AI","org":"mistral","city":"pa","cityName":"Paris","country":"France","lat":48.85,"lon":2.35,"params":250,"score":90,"open":false,"t":1784073600000,"jlat":-0.4545454545454546,"jlon":0.6461538461538462},
  {"date":"2026-07","name":"Kimi K3","lab":"Moonshot AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":2800,"score":94,"open":true,"t":1784073600000,"jlat":-0.8181818181818181,"jlon":0.46153846153846145},
  {"date":"2026-07","name":"macalla-v5","lab":"Foxxe AI","org":"foxxe","city":"dg","cityName":"Donegal","country":"Ireland","lat":54.9,"lon":-8,"params":8.19,"score":74,"open":false,"t":1784073600000,"jlat":0.09090909090909083,"jlon":0.8307692307692307},
  {"date":"2026-08","name":"Grok 4.6","lab":"xAI","org":"xai","city":"sf","cityName":"San Francisco","country":"USA","lat":37.77,"lon":-122.42,"params":1600,"score":96,"open":false,"t":1786752000000,"jlat":0.2727272727272727,"jlon":0.8307692307692307},
  {"date":"2026-08","name":"GLM-5.3","lab":"Zhipu AI","org":"cn","city":"bj","cityName":"Beijing","country":"China","lat":39.9,"lon":116.4,"params":420,"score":93,"open":true,"t":1786752000000,"jlat":-0.09090909090909094,"jlon":0.6461538461538462},
  {"date":"2026-08","name":"Hy4-preview","lab":"Tencent","org":"cn","city":"sz","cityName":"Shenzhen","country":"China","lat":22.54,"lon":114.06,"params":400,"score":92,"open":true,"t":1786752000000,"jlat":0.6363636363636365,"jlon":0.8307692307692307},
];

export const LEGEND = Object.keys(ORGS).map((k) => ({ key: k, label: ORGS[k].label }));
export const T_MIN = MODELS[0].t;
export const T_MAX = MODELS[MODELS.length - 1].t;

// Coastline polygons as [lon, lat] rings, carried over unchanged from the
// canvas export. Low-poly on purpose: it reads as a globe at any size and costs
// nothing to draw every frame.
export const COAST = [[[141,-3],[145,-4],[148,-6],[147,-7],[149,-9],[150,-10],[150,-11],[148,-10],[146,-8],[143,-8],[142,-9],[139,-8],[138,-8],[138,-5],[134,-4],[133,-4],[133,-2],[132,-2],[131,-1],[134,-1],[135,-3],[138,-2],[141,-3]],[[114,5],[116,6],[118,6],[119,5],[119,4],[118,2],[118,1],[117,-1],[116,-4],[114,-3],[112,-3],[110,-2],[109,0],[110,2],[112,3],[114,5]],[[-88,74],[-93,75],[-96,76],[-95,77],[-91,76],[-89,76],[-85,76],[-80,75],[-82,74],[-88,74]],[[-82,23],[-80,23],[-78,22],[-76,21],[-75,21],[-75,20],[-78,20],[-78,21],[-79,22],[-82,22],[-83,23],[-84,22],[-83,23],[-82,23]],[[-56,51],[-56,50],[-55,49],[-54,49],[-53,48],[-54,47],[-55,47],[-56,48],[-59,48],[-58,49],[-56,52],[-56,51]],[[-84,65],[-82,64],[-81,63],[-84,64],[-87,64],[-86,66],[-84,65]],[[-79,72],[-74,72],[-71,71],[-67,69],[-65,68],[-62,66],[-67,66],[-67,65],[-65,63],[-69,64],[-66,62],[-72,63],[-75,65],[-79,65],[-74,65],[-73,67],[-75,69],[-77,70],[-79,70],[-87,70],[-88,71],[-89,73],[-87,73],[-82,74],[-79,72]],[[-100,73],[-99,74],[-98,73],[-98,71],[-102,72],[-100,73]],[[-108,76],[-106,75],[-112,74],[-112,75],[-116,76],[-111,76],[-110,77],[-108,76]],[[-122,74],[-117,74],[-119,73],[-123,71],[-125,72],[-125,74],[-122,74]],[[-125,50],[-124,49],[-126,49],[-128,50],[-127,51],[-125,50]],[[50,-12],[50,-15],[50,-16],[49,-18],[48,-22],[46,-25],[44,-25],[43,-23],[44,-21],[44,-19],[44,-17],[45,-16],[46,-16],[48,-14],[49,-13],[50,-12]],[[-49,-78],[-45,-78],[-43,-80],[-47,-81],[-53,-81],[-52,-80],[-50,-79],[-49,-78]],[[-74,-71],[-72,-71],[-71,-69],[-69,-70],[-68,-71],[-69,-72],[-72,-72],[-74,-72],[-74,-71]],[[153,-4],[153,-5],[152,-3],[151,-3],[152,-3],[153,-4]],[[151,-6],[150,-6],[148,-5],[150,-5],[151,-5],[152,-4],[152,-5],[151,-6]],[[177,-40],[175,-42],[175,-40],[174,-39],[175,-37],[174,-36],[173,-34],[175,-36],[176,-37],[177,-38],[178,-39],[177,-39],[177,-40]],[[170,-44],[172,-42],[173,-40],[174,-41],[174,-42],[173,-44],[171,-45],[169,-47],[167,-46],[168,-44],[170,-44]],[[148,-41],[148,-42],[147,-44],[145,-43],[145,-41],[147,-41],[148,-41]],[[126,-32],[124,-33],[122,-34],[120,-34],[119,-35],[117,-35],[115,-34],[116,-33],[115,-31],[115,-29],[114,-27],[114,-26],[114,-25],[114,-24],[114,-22],[115,-21],[117,-21],[119,-20],[120,-20],[122,-19],[122,-17],[124,-17],[124,-16],[125,-15],[126,-14],[127,-14],[129,-15],[130,-14],[131,-13],[133,-12],[132,-11],[134,-12],[136,-12],[137,-12],[136,-13],[135,-15],[137,-16],[139,-17],[140,-18],[141,-16],[142,-15],[142,-13],[142,-12],[143,-11],[143,-12],[144,-13],[145,-14],[145,-15],[146,-17],[146,-19],[149,-20],[150,-22],[151,-22],[152,-24],[153,-27],[154,-29],[153,-31],[152,-33],[151,-35],[150,-37],[148,-38],[146,-39],[145,-38],[143,-39],[141,-38],[140,-36],[138,-35],[137,-35],[138,-34],[136,-34],[135,-34],[134,-33],[131,-31],[127,-32],[126,-32]],[[123,1],[125,1],[123,0],[120,-1],[123,-1],[122,-2],[122,-4],[123,-6],[122,-5],[121,-4],[120,-4],[119,-5],[119,-3],[119,-1],[121,1],[123,1]],[[108,-6],[111,-6],[114,-8],[113,-8],[111,-8],[108,-8],[105,-7],[108,-6]],[[104,-1],[106,-2],[106,-6],[103,-4],[101,-2],[99,1],[97,3],[95,5],[98,4],[101,2],[103,1],[104,-1]],[[126,8],[126,6],[124,7],[123,7],[122,7],[123,9],[125,9],[126,9],[126,8]],[[142,39],[141,36],[139,35],[135,34],[132,34],[131,31],[130,32],[130,34],[133,35],[137,37],[139,38],[140,41],[142,39]],[[145,44],[144,43],[141,42],[140,43],[142,46],[145,44]],[[-4,59],[-3,58],[-3,56],[0,54],[2,53],[1,51],[-2,51],[-5,50],[-4,51],[-5,52],[-5,53],[-4,55],[-5,56],[-6,56],[-5,59],[-4,59]],[[-7.4,55.4],[-6.9,55.2],[-6,55],[-5.6,54.6],[-5.9,54.2],[-6.1,53.9],[-6.1,53.3],[-6,52.8],[-6.4,52.2],[-7.5,51.9],[-8.3,51.6],[-9.4,51.5],[-10,51.6],[-9.8,52.1],[-9.9,52.6],[-9.3,53.2],[-9.9,53.4],[-10.1,54],[-9.2,54.3],[-8.6,54.4],[-8.8,55],[-8.2,55.2],[-7.4,55.4]],[[-15,66],[-15,64],[-20,64],[-24,65],[-24,66],[-21,66],[-16,67],[-15,66]],[[143,54],[144,51],[143,48],[143,47],[142,48],[142,51],[143,54]],[[122,18],[122,16],[122,14],[124,14],[124,13],[123,13],[121,14],[121,15],[120,15],[120,18],[122,18]],[[-77,9],[-76,9],[-75,11],[-73,11],[-72,12],[-71,12],[-72,11],[-72,9],[-71,10],[-70,12],[-69,11],[-67,11],[-65,10],[-63,11],[-62,10],[-61,9],[-59,8],[-58,7],[-56,6],[-54,6],[-52,5],[-51,4],[-50,1],[-49,0],[-47,-1],[-45,-3],[-40,-3],[-36,-5],[-35,-7],[-36,-10],[-38,-13],[-39,-16],[-40,-18],[-41,-22],[-43,-23],[-46,-24],[-49,-27],[-49,-29],[-52,-32],[-53,-34],[-56,-35],[-58,-34],[-57,-35],[-57,-37],[-61,-39],[-62,-40],[-64,-41],[-65,-42],[-63,-43],[-65,-45],[-67,-46],[-66,-47],[-68,-50],[-69,-52],[-71,-54],[-74,-53],[-75,-52]],[[-78,7],[-78,6],[-77,4],[-78,3],[-79,2],[-80,1],[-81,-1],[-81,-2],[-80,-3],[-81,-5],[-81,-7],[-79,-8],[-76,-14],[-75,-15],[-71,-18],[-70,-21],[-71,-28],[-72,-31],[-73,-36],[-74,-38],[-74,-42],[-73,-42],[-74,-44],[-74,-47],[-75,-50],[-75,-52]],[[-75,-53],[-71,-54],[-69,-53],[-68,-54],[-66,-55],[-67,-55],[-69,-55],[-72,-54],[-75,-53]],[[45,81],[49,81],[52,81],[49,80],[47,80],[45,81]],[[54,74],[58,76],[66,77],[68,76],[58,74],[56,72],[54,71],[51,72],[54,74]],[[15,80],[18,80],[18,78],[16,77],[13,78],[13,80],[15,80]],[[-78,7],[-78,8],[-79,9],[-80,8],[-81,7],[-82,8],[-83,8],[-84,9],[-85,10],[-86,10],[-86,11],[-87,12],[-87,13],[-88,13],[-90,14],[-91,14],[-93,16],[-95,16],[-97,16],[-100,17],[-102,18],[-104,19],[-106,20],[-105,21],[-106,22],[-108,25],[-109,26],[-110,27],[-112,28],[-113,30],[-114,32],[-115,31],[-114,30],[-113,29],[-113,28],[-112,27],[-111,25],[-110,24],[-110,23],[-111,24],[-112,25],[-113,27],[-114,27],[-115,28],[-115,29],[-116,31],[-117,33],[-119,34],[-120,34],[-122,36],[-123,38],[-124,40],[-125,43],[-124,46],[-125,48],[-123,47],[-123,49],[-126,50],[-128,52],[-131,54],[-132,55],[-134,58],[-138,58],[-143,60],[-147,61],[-149,60],[-152,59],[-150,61],[-153,60],[-154,58],[-157,57],[-160,56],[-162,55],[-165,55],[-162,56],[-159,57],[-158,58],[-159,59],[-160,59],[-162,59],[-163,60],[-165,61],[-166,62],[-164,63],[-162,63],[-162,64],[-162,65],[-165,64],[-168,66],[-164,67],[-162,67],[-165,68],[-164,69],[-162,70],[-158,71],[-154,71],[-152,71],[-148,70],[-144,70],[-139,69],[-136,69],[-131,70],[-128,70],[-126,69],[-123,70],[-120,69],[-115,69],[-113,68],[-109,67],[-108,69],[-105,69],[-101,68],[-99,68],[-96,67],[-94,69],[-96,71],[-93,71],[-91,69],[-88,69],[-86,68],[-84,70],[-81,69],[-81,67],[-86,67],[-87,65],[-91,64],[-93,62],[-95,59],[-92,57],[-88,56],[-85,55],[-82,54],[-80,51],[-79,54],[-77,56],[-77,58],[-78,61],[-76,62],[-73,62],[-70,61],[-68,59],[-65,60],[-63,58],[-60,56],[-57,55],[-56,53],[-57,51],[-62,50],[-66,50],[-70,48],[-69,48],[-64,49],[-64,46],[-61,47],[-61,45],[-65,44],[-64,45],[-67,45],[-70,44],[-71,42],[-70,42],[-71,41],[-72,41],[-74,41],[-74,40],[-75,39],[-75,38],[-76,38],[-77,39],[-76,38],[-76,37],[-77,35],[-79,33],[-81,32],[-81,30],[-81,28],[-80,26],[-81,25],[-82,27],[-83,29],[-84,30],[-86,30],[-88,30],[-89,30],[-89,29],[-91,29],[-93,30],[-96,29],[-97,27],[-97,26],[-98,23],[-97,21],[-96,19],[-94,18],[-92,19],[-91,20],[-90,21],[-87,22],[-87,20],[-88,19],[-88,18],[-88,17],[-89,16],[-88,16],[-86,16],[-85,16],[-84,16],[-83,15],[-83,14],[-84,13],[-84,12],[-84,11],[-83,10]],[[-83,10],[-82,9],[-81,9],[-80,10],[-79,9],[-77,9]],[[-72,20],[-71,20],[-70,19],[-69,19],[-69,18],[-70,18],[-71,18],[-72,18],[-73,18],[-74,19],[-72,19],[-73,20],[-72,20]],[[-16,19],[-17,21],[-17,22],[-16,23],[-15,25],[-14,26],[-13,28],[-10,29],[-9,32],[-8,34],[-6,36],[-4,35],[-1,36],[1,37],[5,37],[8,37],[10,37],[11,37],[11,36],[10,34],[11,33],[14,33],[17,31],[20,31],[20,32],[23,33],[24,32],[26,32],[29,31],[31,32],[32,31],[34,31],[35,32],[35,33],[36,35],[36,36],[35,37],[32,37],[30,36],[27,38],[26,39],[29,41],[34,42],[38,41],[42,42],[41,43],[39,44],[37,45],[39,47],[37,47],[35,46],[37,45],[34,44],[32,45],[33,46],[31,47],[30,45],[29,44],[28,42],[29,41],[26,40],[25,41],[24,40],[23,40],[23,39],[24,38],[23,37],[22,36],[21,38],[20,40],[19,40],[20,42],[19,42],[17,43],[15,44],[14,45],[13,46],[12,45],[14,43],[16,42],[18,41],[18,40],[16,40],[17,39],[16,38],[16,40],[15,41],[13,41],[11,43],[9,44],[7,44],[3,43],[2,41],[0,40],[0,38],[-2,37],[-5,36],[-6,36],[-8,37],[-9,38],[-10,39],[-9,40],[-9,42],[-9,43],[-5,44],[-2,43],[-2,47],[-5,49],[-2,50],[2,51],[4,52],[7,53],[8,54],[9,55],[8,57],[10,57],[11,56],[10,55],[11,54],[14,54],[16,55],[19,54],[21,55],[22,57],[24,57],[24,58],[25,59],[28,59],[26,60],[22,60],[21,63],[25,65],[24,66],[21,64],[17,61],[18,59],[16,56],[13,55],[11,59],[7,58],[5,62],[11,64],[16,69],[23,70],[28,71],[31,70],[37,69],[41,67],[34,67],[35,65],[37,64],[37,65],[40,65],[44,66],[44,68],[47,68],[46,67],[54,69],[55,68],[59,69],[60,70],[65,69],[68,69],[67,70],[69,72],[73,73],[72,71],[74,68],[72,66],[74,67],[75,69],[74,71],[75,73],[75,71],[78,72],[81,73],[85,74],[87,75],[93,76],[97,76],[101,77],[106,77],[107,76],[113,76],[113,75],[111,74],[114,73],[119,74],[123,74],[129,73],[130,71],[134,71],[138,72],[140,73],[153,71],[160,70],[162,70],[168,70],[170,70],[176,70],[180,69]],[[180,65],[178,64],[179,63],[175,62],[171,60],[166,60],[164,60],[162,58],[162,56],[160,54],[158,52],[156,53],[157,57],[160,59],[164,63],[160,61],[154,60],[151,59],[149,59],[139,57],[137,54],[140,54],[141,51],[139,47],[136,44],[133,43],[131,42],[130,42],[129,40],[128,40],[128,39],[129,37],[128,35],[126,35],[127,37],[126,38],[125,38],[125,39],[125,40],[123,40],[122,39],[122,41],[119,39],[118,38],[120,37],[122,37],[121,36],[120,34],[122,32],[122,30],[122,28],[120,26],[116,23],[114,23],[111,21],[110,20],[109,22],[106,20],[107,17],[109,13],[107,10],[105,9],[103,11],[102,13],[100,13],[99,10],[100,8],[102,7],[103,6],[103,4],[104,3],[104,1],[101,3],[100,5],[100,7],[99,8],[98,9],[99,11],[98,14],[97,17],[95,16],[94,18],[93,20],[92,22],[90,23],[90,22],[89,22],[87,21],[85,19],[82,17],[81,16],[80,14],[80,10],[79,9],[78,8],[76,11],[75,14],[73,18],[73,21],[69,22],[68,24],[66,25],[61,25],[57,26],[56,27],[52,28],[50,30],[49,30],[48,29],[49,27],[50,26],[51,25],[52,26],[52,24],[53,24],[55,25],[56,26],[57,24],[59,23],[60,22],[59,21],[58,20],[58,19],[57,18],[55,18],[54,17],[52,16],[51,15],[48,14],[47,13],[45,13],[44,13],[43,13],[43,15],[43,16],[43,17],[42,18],[40,20],[39,22],[38,24],[37,25],[36,27],[35,28],[35,29],[34,28],[32,30],[34,26],[36,24],[37,22],[37,21],[38,18],[39,16],[42,14],[43,13],[43,12],[44,11],[46,11],[48,11],[49,11],[51,12],[51,11],[51,9],[49,5],[46,2],[42,-1],[41,-2],[40,-3],[39,-5],[39,-7],[39,-8],[40,-10],[40,-12],[41,-15],[39,-17],[36,-19],[35,-20],[35,-22],[36,-23],[35,-24],[33,-25],[33,-26],[32,-28],[31,-29],[30,-31],[27,-33],[26,-34],[24,-34],[22,-34],[20,-35],[18,-34],[18,-33],[18,-32],[17,-30],[15,-27],[14,-24],[14,-22],[13,-19],[12,-17],[12,-14],[13,-12],[14,-11],[13,-9],[13,-8],[12,-6],[11,-4],[9,-1],[9,0],[10,2],[9,4],[9,5],[7,4],[5,6],[3,6],[-1,5],[-3,5],[-5,5],[-8,4],[-9,5],[-11,7],[-13,8],[-14,9],[-15,10],[-15,11],[-16,12],[-17,12],[-17,14],[-17,16],[-16,17],[-16,19]],[[126,-8],[127,-8],[125,-9],[123,-10],[125,-9],[126,-8]],[[-180,69],[-175,67],[-172,67],[-173,65],[-174,64],[-176,65],[-179,66],[-179,65],[-180,65]],[[47,45],[49,46],[52,47],[53,45],[51,45],[51,44],[53,42],[53,41],[54,42],[53,41],[53,39],[54,37],[51,37],[49,38],[49,39],[50,41],[49,42],[47,45]],[[-107,73],[-104,71],[-101,70],[-102,69],[-107,69],[-113,69],[-116,69],[-115,70],[-114,71],[-118,71],[-119,72],[-115,73],[-112,73],[-109,73],[-108,73],[-107,73]],[[-92,82],[-87,82],[-83,82],[-79,83],[-73,83],[-66,83],[-62,82],[-68,82],[-69,81],[-74,79],[-76,79],[-78,78],[-80,77],[-81,76],[-88,76],[-88,77],[-85,78],[-87,79],[-87,80],[-83,80],[-88,81],[-91,82],[-92,82]],[[-47,83],[-39,84],[-21,83],[-32,82],[-25,82],[-23,81],[-13,82],[-17,80],[-19,79],[-18,77],[-20,76],[-19,74],[-21,73],[-22,73],[-25,72],[-22,71],[-26,71],[-24,70],[-28,68],[-33,68],[-37,66],[-41,65],[-43,63],[-43,60],[-48,61],[-52,64],[-54,66],[-53,68],[-51,70],[-53,69],[-54,71],[-53,71],[-56,72],[-56,74],[-59,76],[-66,76],[-71,77],[-71,78],[-69,79],[-68,80],[-62,81],[-57,82],[-50,82],[-45,82],[-47,83]],[[-155.9,19.9],[-155,19.7],[-154.8,19.5],[-155.3,18.9],[-156,19.3],[-155.9,19.9]],[[-156.7,21],[-156,20.8],[-155.9,20.5],[-156.5,20.5],[-156.7,21]],[[-158.3,21.7],[-157.6,21.3],[-157.6,21.6],[-158.3,21.7]],[[-159.8,22.2],[-159.3,21.9],[-159.4,22.2],[-159.8,22.2]]];

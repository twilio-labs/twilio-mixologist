import { h, Component } from 'preact';

import style from './style';

const MIN_HEIGHT = 10;
const MAX_HEIGHT = 289;
const FLEXIBLE_HEIGHT = MAX_HEIGHT - MIN_HEIGHT;

export default class Cup extends Component {
  render() {
    const { value, percentage } = this.props;
    const filledHeight =
      MIN_HEIGHT + FLEXIBLE_HEIGHT * (1 - percentage % 100 / 100.0);

    return (
      <div class={style.cup}>
        <svg
          viewBox="0 32 323 435.99999999999994"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="fillingClipPath">
              <path
                transform="rotate(-180 161.50000000000003,299.4564208984375) "
                d="m61.9728,443.33417l37.322701,-287.755478l124.409011,0l37.322688,287.755478l-199.054401,0z"
                stroke-opacity="null"
                stroke-width="0"
              />
            </clipPath>
          </defs>
          <g>
            <path
              transform="rotate(-180 161.50000000000003,298.3550109863281) "
              class={style.frame}
              d="m40.500002,458.854998l45.375001,-320.999996l151.250011,0l45.374984,320.999996l-241.999996,0z"
              stroke-width="12"
            />
            <path
              class={style.lidBottom}
              d="m19.5,107.590813l284,0l0,28.909187l-284,0l0,-28.909187z"
              stroke-opacity="null"
              stroke-linecap="null"
              stroke-linejoin="null"
              stroke-width="12"
              fill-opacity="null"
            />
            <path
              transform="rotate(-180 161.50000000000003,299.4564208984375) "
              class={style.filling}
              d="m61.9728,443.33417l37.322701,-287.755478l124.409011,0l37.322688,287.755478l-199.054401,0z"
              stroke-opacity="null"
              stroke-width="0"
            />
            <rect
              class={style.emptyOverride}
              x="62"
              y="155"
              width="200"
              height={filledHeight}
              clip-path="url(#fillingClipPath)"
            />
            <path
              class={style.lidTop}
              d="m32.182707,106.107988l48.493986,-46.363314l161.64663,0l48.493969,46.363314l-258.634586,0z"
              fill-opacity="null"
              stroke-opacity="null"
              stroke-width="12"
            />
            <path
              class={style.label}
              d="m47.370051,249.577458l228.259898,-0.563373l-10.401717,71.549296l-207.745399,0l-10.112781,-70.985923z"
              fill-opacity="null"
              stroke-opacity="null"
              stroke-width="2"
            />
            <text class={style.orders} text-anchor="middle" x="161.5" y="300">
              {value}
            </text>
          </g>
        </svg>
      </div>
    );
  }
}

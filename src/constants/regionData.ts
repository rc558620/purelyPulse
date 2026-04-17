// 省市区级联数据（简化版）
import type { CascaderOption } from '@components/form/CascaderView/types';

export const REGION_DATA: CascaderOption[] = [
    {
        label: '广东省',
        value: 'guangdong',
        children: [
            {
                label: '深圳市',
                value: 'shenzhen',
                children: [
                    { label: '南山区', value: 'nanshan' },
                    { label: '福田区', value: 'futian' },
                    { label: '宝安区', value: 'baoan' },
                    { label: '龙岗区', value: 'longgang' },
                    { label: '龙华区', value: 'longhua' },
                ],
            },
            {
                label: '广州市',
                value: 'guangzhou',
                children: [
                    { label: '天河区', value: 'tianhe' },
                    { label: '海珠区', value: 'haizhu' },
                    { label: '越秀区', value: 'yuexiu' },
                    { label: '番禺区', value: 'panyu' },
                    { label: '白云区', value: 'baiyun' },
                ],
            },
            {
                label: '东莞市',
                value: 'dongguan',
                children: [
                    { label: '莞城区', value: 'guancheng' },
                    { label: '南城区', value: 'nancheng' },
                    { label: '东城区', value: 'dongcheng' },
                    { label: '万江区', value: 'wanjiang' },
                ],
            },
        ],
    },
    {
        label: '北京市',
        value: 'beijing',
        children: [
            {
                label: '北京市',
                value: 'beijing_city',
                children: [
                    { label: '朝阳区', value: 'chaoyang' },
                    { label: '海淀区', value: 'haidian' },
                    { label: '东城区', value: 'dongcheng_bj' },
                    { label: '西城区', value: 'xicheng' },
                    { label: '丰台区', value: 'fengtai' },
                    { label: '通州区', value: 'tongzhou' },
                ],
            },
        ],
    },
    {
        label: '上海市',
        value: 'shanghai',
        children: [
            {
                label: '上海市',
                value: 'shanghai_city',
                children: [
                    { label: '黄浦区', value: 'huangpu' },
                    { label: '浦东新区', value: 'pudong' },
                    { label: '徐汇区', value: 'xuhui' },
                    { label: '静安区', value: 'jingan' },
                    { label: '杨浦区', value: 'yangpu' },
                    { label: '虹口区', value: 'hongkou' },
                ],
            },
        ],
    },
    {
        label: '浙江省',
        value: 'zhejiang',
        children: [
            {
                label: '杭州市',
                value: 'hangzhou',
                children: [
                    { label: '西湖区', value: 'xihu' },
                    { label: '滨江区', value: 'binjiang' },
                    { label: '余杭区', value: 'yuhang' },
                    { label: '拱墅区', value: 'gongshu' },
                    { label: '上城区', value: 'shangcheng' },
                ],
            },
            {
                label: '宁波市',
                value: 'ningbo',
                children: [
                    { label: '海曙区', value: 'haishu' },
                    { label: '江北区', value: 'jiangbei_nb' },
                    { label: '鄞州区', value: 'yinzhou' },
                    { label: '镇海区', value: 'zhenhai' },
                ],
            },
        ],
    },
    {
        label: '江苏省',
        value: 'jiangsu',
        children: [
            {
                label: '南京市',
                value: 'nanjing',
                children: [
                    { label: '玄武区', value: 'xuanwu' },
                    { label: '秦淮区', value: 'qinhuai' },
                    { label: '建邺区', value: 'jianye' },
                    { label: '鼓楼区', value: 'gulou_nj' },
                    { label: '栖霞区', value: 'qixia' },
                ],
            },
            {
                label: '苏州市',
                value: 'suzhou',
                children: [
                    { label: '姑苏区', value: 'gusu' },
                    { label: '吴中区', value: 'wuzhong' },
                    { label: '相城区', value: 'xiangcheng' },
                    { label: '工业园区', value: 'gongyeyuan' },
                ],
            },
        ],
    },
];
